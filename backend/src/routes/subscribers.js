import { Router } from "express";
import { pool} from "../db.js"; // <- same db import as your other route files
import { requireAuth } from "../middleware/auth.js"; // <- copy these two imports and the
import { requireAdmin } from "../middleware/auth.js";
import { readUnsubToken } from "../lib/unsubscribe.js"; //    admin check exactly as in vouchers.js

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const row = (r) => ({
  id: r.id,
  email: r.email,
  isActive: r.is_active,
  createdAt: r.created_at,
});

// PUBLIC: sign up from the Home page
router.post("/", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email || email.length > 254 || !EMAIL.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    await pool.query(
      "INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
      [email]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ADMIN: list (newest first)
router.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, is_active, created_at FROM subscribers ORDER BY created_at DESC, id DESC"
    );
    res.json(rows.map(row));
  } catch (err) {
    next(err);
  }
});

// ADMIN: mark active / unsubscribed
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (typeof req.body?.isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be true or false." });
    }
    const { rows } = await pool.query(
      "UPDATE subscribers SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active, created_at",
      [req.body.isActive, Number(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: "Subscriber not found." });
    res.json(row(rows[0]));
  } catch (err) {
    next(err);
  }
});

// ADMIN: delete
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM subscribers WHERE id = $1", [
      Number(req.params.id),
    ]);
    if (!rowCount) return res.status(404).json({ error: "Subscriber not found." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
const msgPage = (m) =>
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leith Essence</title>
<body style="font-family:Arial,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;text-align:center">
<p style="letter-spacing:.3em;font-weight:bold">LEITH ESSENCE</p><p>${m}</p></body>`;

// PUBLIC: unsubscribe link from emails
router.get("/unsubscribe", async (req, res, next) => {
  try {
    const email = readUnsubToken(String(req.query.token ?? ""));
    if (!email) return res.status(400).send(msgPage("This unsubscribe link isn't valid."));
    await pool.query(
      `INSERT INTO subscribers (email, is_active) VALUES ($1, false)
       ON CONFLICT (email) DO UPDATE SET is_active = false`,
      [email]
    );
    res.send(msgPage("You've been unsubscribed. You won't get any more announcements from us."));
  } catch (err) {
    next(err);
  }
});

export default router;