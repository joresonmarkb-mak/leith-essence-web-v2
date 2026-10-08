import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Log in to continue." });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Your session expired. Log in again." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, role, is_active FROM users WHERE id = $1", [payload.id]);
    const user = rows[0];
    if (!user || !user.is_active)
      return res.status(401).json({ error: "Your account isn't active. Contact us for help." });
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admins can do that." });
  }
  next();
}