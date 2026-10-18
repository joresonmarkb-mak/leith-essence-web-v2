import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendVerificationEmail, consumeVerificationToken } from "../lib/verification.js";

const router = Router();
const googleClient = new OAuth2Client();

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
  emailVerified: Boolean(u.email_verified_at),
});

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const session = (user) => ({ token: signToken(user), user: publicUser(user) });
const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

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
    let emailSent = true;
    try {
      await sendVerificationEmail(rows[0]);
    } catch (err) {
      emailSent = false;
      console.error("verification email failed:", err.message);
    }
    // No login yet: they must confirm their email first
    res.status(201).json({ needsVerification: true, email: rows[0].email, emailSent });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "That email is already registered." });
    }
    fail(res, err);
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
    if (!user.email_verified_at) {
      return res.status(403).json({
        error: "Please confirm your email first. Check your inbox for the link.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    res.json(session(user));
  } catch (err) {
    fail(res, err);
  }
});

// The link in the email lands on the site, which posts the token here
router.post("/verify-email", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: "This link isn't valid." });
  }
  try {
    const userId = await consumeVerificationToken(token);
    if (!userId) {
      return res.status(400).json({ error: "This link has expired or was already used. Log in to get a new one." });
    }
    const { rows } = await pool.query(
      "UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1 RETURNING *",
      [userId]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Your account isn't active. Contact us for help." });
    }
    res.json(session(user));
  } catch (err) {
    fail(res, err);
  }
});

// Always the same answer, so nobody can use this to find out who has an account
router.post("/resend-verification", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const reply = { message: "If that email has an unconfirmed account, we've sent a new link." };
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (user && user.is_active && !user.email_verified_at) {
      const recent = await pool.query(
        "SELECT 1 FROM email_verifications WHERE user_id = $1 AND created_at > now() - interval '60 seconds'",
        [user.id]
      );
      if (!recent.rows[0]) await sendVerificationEmail(user);
    }
    res.json(reply);
  } catch (err) {
    fail(res, err);
  }
});

router.post("/google", async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google sign-in isn't set up yet." });
  }
  const credential = typeof req.body?.credential === "string" ? req.body.credential : "";
  if (!credential) return res.status(400).json({ error: "Google sign-in failed. Try again." });

  let p;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    p = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Google sign-in failed. Try again." });
  }
  if (!p?.sub || !p.email || !p.email_verified) {
    return res.status(401).json({ error: "Your Google email isn't verified." });
  }
  const email = p.email.trim().toLowerCase();

  try {
    let user = (await pool.query("SELECT * FROM users WHERE google_id = $1", [p.sub])).rows[0];
    if (!user) user = (await pool.query("SELECT * FROM users WHERE email = $1", [email])).rows[0];

    if (user) {
      if (!user.is_active) {
        return res.status(401).json({ error: "Your account isn't active. Contact us for help." });
      }
      if (user.google_id && user.google_id !== p.sub) {
        return res.status(409).json({ error: "That email is linked to a different Google account." });
      }
      // Link Google to the existing account. If that account never confirmed its email,
      // drop its password so nobody who pre-registered with this address can still use it.
      const { rows } = await pool.query(
        `UPDATE users
         SET google_id = $1,
             password_hash = CASE WHEN email_verified_at IS NULL THEN NULL ELSE password_hash END,
             email_verified_at = COALESCE(email_verified_at, now())
         WHERE id = $2 RETURNING *`,
        [p.sub, user.id]
      );
      return res.json(session(rows[0]));
    }

    const first = clean(p.given_name) || clean(p.name) || email.split("@")[0];
    const last = clean(p.family_name) || "";
    const { rows } = await pool.query(
      `INSERT INTO users (email, first_name, last_name, google_id, email_verified_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [email, first, last, p.sub]
    );
    res.status(201).json(session(rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Please try signing in again." });
    }
    fail(res, err);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });
  res.json(publicUser(rows[0]));
});

const PH_MOBILE = /^(\+63|0)?9\d{9}$/;

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
    fail(res, err);
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
    fail(res, err);
  }
});

export default router;