import crypto from "crypto";
import { pool } from "../db.js";
import { sendMail } from "./mailer.js";
import { verifyEmailTemplate } from "./emailTemplates.js";

const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

export async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString("hex");
  await pool.query("DELETE FROM email_verifications WHERE user_id = $1", [user.id]);
  await pool.query(
    "INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '24 hours')",
    [user.id, sha(token)]
  );
  const url = `${process.env.SITE_URL}/verify-email?token=${token}`;
  const { html, text } = verifyEmailTemplate({ firstName: user.first_name, url });
  try {
    await sendMail({ to: user.email, subject: "Confirm your email for Leith Essence", html, text });
  } catch (err) {
    await pool.query("DELETE FROM email_verifications WHERE user_id = $1", [user.id]);
    throw err;
  }
}

// One-time use: the row is deleted as it is read
export async function consumeVerificationToken(token) {
  const { rows } = await pool.query(
    "DELETE FROM email_verifications WHERE token_hash = $1 AND expires_at > now() RETURNING user_id",
    [sha(token)]
  );
  return rows[0]?.user_id ?? null;
}