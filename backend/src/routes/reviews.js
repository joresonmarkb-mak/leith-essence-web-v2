import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ⚠️ ADJUST THESE IF YOUR NAMES DIFFER
const RECEIVED_STATUSES = ["delivered", "received", "completed"];
const BOUGHT_SQL = `
  SELECT 1
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.user_id = $1 AND oi.perfume_id = $2
    AND o.status = 'fulfilled' AND o.received_at IS NOT NULL
  LIMIT 1`;

async function hasReceived(userId, perfumeId) {
  const r = await pool.query(BOUGHT_SQL, [userId, perfumeId]);
  return r.rowCount > 0;
}

/* ---------- Public: reviews of one perfume ---------- */
router.get("/perfume/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });

  const list = await pool.query(
    `SELECT r.id, r.rating, r.body, r.created_at AS "createdAt",
            u.first_name AS "firstName", u.last_name AS "lastName"
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.perfume_id = $1 AND r.is_hidden = false
     ORDER BY r.created_at DESC`,
    [id]
  );

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  const reviews = list.rows.map((r) => {
    counts[r.rating]++;
    sum += r.rating;
    return {
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      name: `${r.firstName} ${(r.lastName || "").charAt(0)}.`.trim(),
    };
  });

  res.json({
    summary: {
      count: reviews.length,
      average: reviews.length ? Math.round((sum / reviews.length) * 10) / 10 : 0,
      counts,
    },
    reviews,
  });
});

/* ---------- Logged in: can I review? + my review ---------- */
router.get("/perfume/:id/mine", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const canReview = await hasReceived(req.user.id, id);
  const mine = await pool.query(
    `SELECT id, rating, body FROM reviews WHERE perfume_id=$1 AND user_id=$2`,
    [id, req.user.id]
  );
  res.json({ canReview, review: mine.rows[0] || null });
});

/* ---------- Create or edit my review ---------- */
router.put("/perfume/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const rating = Number(req.body?.rating);
  const body = String(req.body?.body ?? "").trim().slice(0, 1000);

  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Choose a rating from 1 to 5." });
  if (!(await hasReceived(req.user.id, id)))
    return res.status(403).json({ error: "Only customers who received this perfume can review it." });

  const r = await pool.query(
    `INSERT INTO reviews (perfume_id, user_id, rating, body)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (perfume_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = now()
     RETURNING id, rating, body`,
    [id, req.user.id, rating, body || null]
  );
  res.json(r.rows[0]);
});

router.delete("/perfume/:id/mine", requireAuth, async (req, res) => {
  await pool.query(`DELETE FROM reviews WHERE perfume_id=$1 AND user_id=$2`, [
    Number(req.params.id),
    req.user.id,
  ]);
  res.status(204).end();
});

/* ---------- Admin ---------- */
router.use("/admin", requireAuth, requireAdmin);

router.get("/admin", async (req, res) => {
  const { perfumeId, rating, status, q } = req.query;
  const where = [];
  const vals = [];
  if (perfumeId) { vals.push(Number(perfumeId)); where.push(`r.perfume_id = $${vals.length}`); }
  if (rating)    { vals.push(Number(rating));    where.push(`r.rating = $${vals.length}`); }
  if (status === "visible") where.push(`r.is_hidden = false`);
  if (status === "hidden")  where.push(`r.is_hidden = true`);
  if (q) {
    vals.push(`%${q}%`);
    where.push(`(r.body ILIKE $${vals.length} OR u.email ILIKE $${vals.length} OR p.name ILIKE $${vals.length})`);
  }
  const r = await pool.query(
    `SELECT r.id, r.rating, r.body, r.is_hidden AS "isHidden", r.created_at AS "createdAt",
            p.id AS "perfumeId", p.name AS "perfumeName",
            u.email, u.first_name AS "firstName", u.last_name AS "lastName"
     FROM reviews r
     JOIN perfumes p ON p.id = r.perfume_id
     JOIN users u ON u.id = r.user_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY r.created_at DESC
     LIMIT 300`,
    vals
  );
  res.json(r.rows);
});

router.patch("/admin/:id", async (req, res) => {
  const r = await pool.query(
    `UPDATE reviews SET is_hidden = $1 WHERE id = $2 RETURNING id, is_hidden AS "isHidden"`,
    [Boolean(req.body?.isHidden), Number(req.params.id)]
  );
  if (!r.rowCount) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

router.delete("/admin/:id", async (req, res) => {
  await pool.query(`DELETE FROM reviews WHERE id = $1`, [Number(req.params.id)]);
  res.status(204).end();
});


router.get("/admin/summary", async (_req, res) => {
  const r = await pool.query(`
    SELECT p.id, p.name,
           COUNT(r.id) FILTER (WHERE r.is_hidden = false)::int AS count,
           ROUND(AVG(r.rating) FILTER (WHERE r.is_hidden = false)::numeric, 1)::float AS average,
           COUNT(r.id) FILTER (WHERE r.is_hidden = true)::int AS hidden
    FROM perfumes p
    LEFT JOIN reviews r ON r.perfume_id = p.id
    GROUP BY p.id, p.name
    ORDER BY average DESC NULLS LAST, count DESC, p.name
  `);
  res.json(r.rows);
});

export default router;