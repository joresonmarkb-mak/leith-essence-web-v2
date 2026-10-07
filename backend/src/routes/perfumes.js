import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// One perfume with its 3 notes packed into a JSON list, in order
const PERFUME_SQL = `
  SELECT p.id, p.name, p.inspired_by AS "inspiredBy", p.description,
                  p.category, p.intensity, p.when_to_wear AS "whenToWear", p.image_url AS "imageUrl",
         COALESCE(
           json_agg(json_build_object('id', n.id, 'name', n.name, 'imageUrl', n.image_url)
                    ORDER BY pn.position) FILTER (WHERE n.id IS NOT NULL),
           '[]'
         ) AS notes
  FROM perfumes p
  LEFT JOIN perfume_notes pn ON pn.perfume_id = p.id
  LEFT JOIN notes n ON n.id = pn.note_id`;

function validate(body) {
  const { name, category, intensity, noteIds } = body;
  if (!name?.trim()) return "Enter the perfume name.";
  if (!["for_him", "for_her", "unisex"].includes(category))
    return "Choose a category: for him, for her, or unisex.";
  if (!["subtle", "moderate", "strong"].includes(intensity))
    return "Choose how noticeable it is: subtle, moderate, or strong.";
  if (!Array.isArray(noteIds) || noteIds.length !== 3 ||
      !noteIds.every(Number.isInteger) || new Set(noteIds).size !== 3)
    return "Pick exactly 3 different main notes.";
      const wear = body.whenToWear ?? [];
  if (!Array.isArray(wear) || !wear.every((w) => ["cool", "summer", "day", "night"].includes(w)))
    return "When to wear can include cool, summer, day, and night.";
  return null;
}

const NOTES_SQL = `
  INSERT INTO perfume_notes (perfume_id, note_id, position)
  SELECT $1, t.note_id, t.pos
  FROM unnest($2::int[]) WITH ORDINALITY AS t(note_id, pos)`;

// Public: list all perfumes
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`${PERFUME_SQL} GROUP BY p.id ORDER BY p.name`);
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

// Public: one perfume
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid perfume id." });
  try {
    const { rows } = await pool.query(`${PERFUME_SQL} WHERE p.id = $1 GROUP BY p.id`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Perfume not found." });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err);
  }
});

// Admin: create
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const problem = validate(body);
  if (problem) return res.status(400).json({ error: problem });

  const { name, inspiredBy, description, category, intensity, imageUrl, noteIds, whenToWear } = body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO perfumes (name, inspired_by, description, category, intensity, image_url,when_to_wear)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name.trim(), inspiredBy || null, description || null, category, intensity, imageUrl || null, whenToWear ?? []]
    );
    await client.query(NOTES_SQL, [rows[0].id, noteIds]);
    await client.query("COMMIT");
    const full = await pool.query(`${PERFUME_SQL} WHERE p.id = $1 GROUP BY p.id`, [rows[0].id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return res.status(400).json({ error: "One of those notes doesn't exist." });
    fail(res, err);
  } finally {
    client.release();
  }
});

// Admin: update (replaces the 3 notes)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid perfume id." });
  const body = req.body ?? {};
  const problem = validate(body);
  if (problem) return res.status(400).json({ error: problem });

  const { name, inspiredBy, description, category, intensity, imageUrl, noteIds,whenToWear } = body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
        const { rowCount } = await client.query(
            `UPDATE perfumes
            SET name = $1, inspired_by = $2, description = $3, category = $4,
                intensity = $5, image_url = $6, when_to_wear = $7
            WHERE id = $8`,
            [name.trim(), inspiredBy || null, description || null, category, intensity, imageUrl || null, whenToWear ?? [], id]
          );
    if (!rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Perfume not found." });
    }
    await client.query("DELETE FROM perfume_notes WHERE perfume_id = $1", [id]);
    await client.query(NOTES_SQL, [id, noteIds]);
    await client.query("COMMIT");
    const full = await pool.query(`${PERFUME_SQL} WHERE p.id = $1 GROUP BY p.id`, [id]);
    res.json(full.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return res.status(400).json({ error: "One of those notes doesn't exist." });
    fail(res, err);
  } finally {
    client.release();
  }
});

// Admin: delete (blocked if a batch or order already uses it)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid perfume id." });
  try {
    const { rowCount } = await pool.query("DELETE FROM perfumes WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Perfume not found." });
    res.status(204).end();
  } catch (err) {
    if (err.code === "23503")
      return res.status(409).json({ error: "This perfume is used in a batch or order. Deactivate it in the batch instead." });
    fail(res, err);
  }
});

export default router;