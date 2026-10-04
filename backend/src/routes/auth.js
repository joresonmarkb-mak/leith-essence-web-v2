import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.first_name,
  lastName: u.last_name,
  phone: u.phone,
  role: u.role,
});

router.post("/register", async (req, res) => {
  const { email, firstName, lastName, phone, password } = req.body;
  if (!email || !firstName || !lastName || !phone || !password) {
    return res.status(400).json({ error: "Fill in every field." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Your password needs at least 8 characters." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, first_name, last_name, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.trim().toLowerCase(), firstName.trim(), lastName.trim(), phone.trim(), hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "That email is already registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Enter your email and password." });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    const user = rows[0];
    const ok =
      user && user.is_active && user.password_hash &&
      (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: "Wrong email or password." });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });
  res.json(publicUser(rows[0]));
});

export default router;