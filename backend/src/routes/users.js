import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// Users page: ?month=2026-10&role=admin&q=maria
router.get("/", async (req, res) => {
  const { month, role, q } = req.query;
  const where = [];
  const params = [];
  if (month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return res.status(400).json({ error: "Month must look like 2026-10." });
    params.push(`${month}-01`);
    const n = params.length;
    where.push(`(u.created_at AT TIME ZONE 'Asia/Manila') >= $${n}::date
                AND (u.created_at AT TIME ZONE 'Asia/Manila') < ($${n}::date + interval '1 month')`);
  }
  if (clean(role)) {
    params.push(clean(role));
    where.push(`u.role = $${params.length}`);
  }
  if (clean(q)) {
    params.push(`%${clean(q)}%`);
    const n = params.length;
    where.push(`(u.first_name ILIKE $${n} OR u.last_name ILIKE $${n} OR u.email ILIKE $${n})`);
  }
  try {
    const [list, total] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
                u.role, u.is_active AS "isActive", u.created_at AS "createdAt",
                COALESCE(o.orders, 0)::int AS orders
         FROM users u
         LEFT JOIN (SELECT user_id, COUNT(*) AS orders FROM orders
                    WHERE status <> 'cancelled' GROUP BY user_id) o ON o.user_id = u.id
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY u.created_at DESC, u.id DESC LIMIT 500`,
        params
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM users"),
    ]);
    res.json({ total: total.rows[0].total, users: list.rows });
  } catch (err) {
    fail(res, err);
  }
});

// "View": one user with their order history
router.get("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid user id." });
  try {
    const [u, stats, recent] = await Promise.all([
      pool.query(
        `SELECT id, first_name AS "firstName", last_name AS "lastName", email, phone, role,
                is_active AS "isActive", created_at AS "createdAt",
                province, city, barangay, street
         FROM users WHERE id = $1`, [id]),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
                COALESCE(SUM(total) FILTER (WHERE status IN ('paid', 'fulfilled')), 0)::float8 AS "totalSpent"
         FROM orders WHERE user_id = $1`, [id]),
      pool.query(
        `SELECT id, status, total::float8 AS total, created_at AS "createdAt"
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 10`, [id]),
    ]);
    if (!u.rows[0]) return res.status(404).json({ error: "User not found." });
    res.json({ ...u.rows[0], ...stats.rows[0], recentOrders: recent.rows });
  } catch (err) {
    fail(res, err);
  }
});

// Make someone an admin (like Lei and Von), or deactivate an account
router.patch("/:id", async (req, res) => {
  const id = toId(req.params.id);
  const b = req.body ?? {};
  if (!id) return res.status(400).json({ error: "Invalid user id." });
  if (id === req.user.id)
    return res.status(409).json({ error: "You can't change your own role or deactivate your own account." });
  if (!("role" in b) && !("isActive" in b))
    return res.status(400).json({ error: "Send a role or isActive." });
  if ("role" in b && !["customer", "admin"].includes(b.role))
    return res.status(400).json({ error: "Role must be customer or admin." });
  if ("isActive" in b && typeof b.isActive !== "boolean")
    return res.status(400).json({ error: "isActive must be true or false." });
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active)
       WHERE id = $3
       RETURNING id, first_name AS "firstName", last_name AS "lastName", email, role,
                 is_active AS "isActive"`,
      [b.role ?? null, b.isActive ?? null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found." });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err);
  }
});

export default router;