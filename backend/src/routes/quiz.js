import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Notes carry points through quiz_option_notes. Intensity (Q7) adds 2. Q1 filters the category.
const RESULT_SQL = `
WITH picked AS (SELECT option_id FROM quiz_answers WHERE attempt_id = $1),
chosen AS (
  SELECT MAX(o.category) AS category, MAX(o.intensity) AS intensity
  FROM picked p JOIN quiz_options o ON o.id = p.option_id
),
note_totals AS (
  SELECT qon.note_id, SUM(qon.points) AS pts
  FROM picked p JOIN quiz_option_notes qon ON qon.option_id = p.option_id
  GROUP BY qon.note_id
),
ceiling AS (
  SELECT COALESCE(SUM(pts), 0) AS pts
  FROM (SELECT pts FROM note_totals ORDER BY pts DESC LIMIT 3) t
),
note_pts AS (
  SELECT pn.perfume_id, SUM(nt.pts) AS pts, ARRAY_AGG(n.name ORDER BY pn.position) AS notes
  FROM perfume_notes pn
  JOIN note_totals nt ON nt.note_id = pn.note_id
  JOIN notes n ON n.id = pn.note_id
  GROUP BY pn.perfume_id
),
stock AS (
  SELECT perfume_id, SUM(remaining) AS remaining
  FROM batch_item_stock GROUP BY perfume_id HAVING SUM(remaining) > 0
)
SELECT pf.id, pf.name, pf.image_url AS "imageUrl", pf.inspired_by AS "inspiredBy", pf.category,
       COALESCE(np.notes, '{}') AS "matchedNotes",
       (COALESCE(np.pts, 0) + CASE WHEN ch.intensity IS NOT NULL AND pf.intensity = ch.intensity THEN 2 ELSE 0 END)::int AS score,
       (ce.pts + CASE WHEN ch.intensity IS NOT NULL THEN 2 ELSE 0 END)::int AS ceiling
FROM perfumes pf
CROSS JOIN chosen ch
CROSS JOIN ceiling ce
JOIN stock s ON s.perfume_id = pf.id
LEFT JOIN note_pts np ON np.perfume_id = pf.id
WHERE pf.category IN ('unisex', ch.category)
ORDER BY score DESC, s.remaining DESC, pf.id
LIMIT 3`;

async function matchesFor(attemptId) {
  const { rows } = await pool.query(RESULT_SQL, [attemptId]);
  return rows.map(({ ceiling, ...r }) => ({
    ...r,
    matchPercent: ceiling > 0 ? Math.min(100, Math.round((r.score * 100) / ceiling)) : 0,
  }));
}

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// Quiz page: questions with their options (scoring is never sent to the browser)
router.get("/questions", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.question_text AS text, q.position, q.max_choices AS "maxChoices",
              json_agg(json_build_object('id', o.id, 'text', o.option_text) ORDER BY o.position) AS options
       FROM quiz_questions q JOIN quiz_options o ON o.question_id = q.id
       WHERE q.is_active
       GROUP BY q.id ORDER BY q.position`);
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

// Submit: { "answers": [ { "questionId": 1, "optionIds": [3] }, ... ] }
router.post("/attempts", requireAuth, async (req, res) => {
  const answers = req.body?.answers;
  if (!Array.isArray(answers)) return res.status(400).json({ error: "Send your answers." });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT q.id AS "questionId", q.max_choices AS "maxChoices", o.id AS "optionId"
       FROM quiz_questions q JOIN quiz_options o ON o.question_id = q.id WHERE q.is_active`);
    const questions = new Map();
    for (const r of rows) {
      if (!questions.has(r.questionId)) questions.set(r.questionId, { max: r.maxChoices, options: new Set() });
      questions.get(r.questionId).options.add(r.optionId);
    }

    const seen = new Set();
    const qIds = [];
    const oIds = [];
    for (const a of answers) {
      const q = questions.get(a?.questionId);
      if (!q) return res.status(400).json({ error: "One of the questions doesn't exist." });
      if (seen.has(a.questionId)) return res.status(400).json({ error: "A question was answered twice." });
      seen.add(a.questionId);
      const ids = a.optionIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > q.max)
        return res.status(400).json({ error: `Pick ${q.max === 1 ? "one answer" : `up to ${q.max} answers`} for each question.` });
      if (new Set(ids).size !== ids.length || !ids.every((id) => q.options.has(id)))
        return res.status(400).json({ error: "One of the answers doesn't belong to its question." });
      for (const id of ids) { qIds.push(a.questionId); oIds.push(id); }
    }
    if (seen.size !== questions.size) return res.status(400).json({ error: "Answer every question to see your match." });

    await client.query("BEGIN");
    const attempt = await client.query("INSERT INTO quiz_attempts (user_id) VALUES ($1) RETURNING id", [req.user.id]);
    const attemptId = attempt.rows[0].id;
    await client.query(
      `INSERT INTO quiz_answers (attempt_id, question_id, option_id)
       SELECT $1, t.q, t.o FROM unnest($2::int[], $3::int[]) AS t(q, o)`,
      [attemptId, qIds, oIds]);
    await client.query("COMMIT");

    res.status(201).json({ attemptId, matches: await matchesFor(attemptId) });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    fail(res, err);
  } finally {
    client.release();
  }
});

// "Your last result" (recomputed, so it reflects today's stock)
router.get("/attempts/latest", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM quiz_attempts WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "You haven't taken the quiz yet." });
    res.json({ attemptId: rows[0].id, matches: await matchesFor(rows[0].id) });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/attempts/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid attempt id." });
  try {
    const { rows } = await pool.query("SELECT 1 FROM quiz_attempts WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Result not found." });
    res.json({ attemptId: id, matches: await matchesFor(id) });
  } catch (err) {
    fail(res, err);
  }
});

export default router;