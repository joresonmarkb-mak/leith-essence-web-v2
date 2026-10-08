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
  province: u.province,
  city: u.city,
  barangay: u.barangay,
  street: u.street,
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

const PH_MOBILE = /^(\+63|0)?9\d{9}$/;
const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Profile page: edit details and address (email is read-only)
router.patch("/me", requireAuth, async (req, res) => {
  const b = req.body ?? {};
  const firstName = clean(b.firstName);
  const lastName = clean(b.lastName);
  const phone = clean(b.phone);
  if (!firstName || !lastName)
    return res.status(400).json({ error: "Enter your first and last name." });
  if (!phone || !PH_MOBILE.test(phone.replace(/[\s-]/g, "")))
    return res.status(400).json({ error: "Enter a Philippine mobile number, like 0917 555 0142." });

  const address = [clean(b.province), clean(b.city), clean(b.barangay), clean(b.street)];
  if (address.some(Boolean) && !address.every(Boolean))
    return res.status(400).json({ error: "Complete your address: province, city, barangay, and street." });

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3,
           province = $4, city = $5, barangay = $6, street = $7
       WHERE id = $8 RETURNING *`,
      [firstName, lastName, phone, ...address, req.user.id]
    );
    res.json(publicUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string")
    return res.status(400).json({ error: "Enter your current password and a new one." });
  if (newPassword.length < 8)
    return res.status(400).json({ error: "Your new password needs at least 8 characters." });
  try {
    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const hash = rows[0]?.password_hash;
    if (!hash)
      return res.status(400).json({ error: "This account signs in with Google and has no password." });
    if (!(await bcrypt.compare(currentPassword, hash)))
      return res.status(400).json({ error: "Your current password is wrong." });
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2",
      [await bcrypt.hash(newPassword, 10), req.user.id]);
    res.json({ message: "Password updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});



export default router;