import { Router } from "express";
import { pool } from "../db.js"; // <- match your other route files
import { requireAuth, requireAdmin } from "../middleware/auth.js"; // <- match vouchers.js
import { sendMail, mailerReady } from "../lib/mailer.js";
import { announcementEmail } from "../lib/emailTemplates.js";
import { unsubToken } from "../lib/unsubscribe.js";

const router = Router();
router.use(requireAuth, requireAdmin);

let running = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AUDIENCES = new Set(["all", "subscribers", "users"]);
const DEFAULT_SUBJECT = "New perfumes have arrived";
const DEFAULT_MESSAGE =
  "Fresh arrivals have just landed at Leith Essence.\n\nDiscover our newest scents and find the one that feels like you.";

// Active subscribers and/or active users, minus anyone who unsubscribed
async function audience(which = "all") {
  const blocked = new Set(
    (await pool.query("SELECT email FROM subscribers WHERE NOT is_active")).rows.map((r) => r.email)
  );
  const subs = [...new Set((await pool.query("SELECT email FROM subscribers WHERE is_active")).rows.map((r) => r.email))];
  const users = [
    ...new Set(
      (await pool.query("SELECT lower(email) AS email FROM users WHERE is_active")).rows
        .map((r) => r.email)
        .filter((e) => e && !blocked.has(e))
    ),
  ];
  const union = [...new Set([...subs, ...users])];
  return {
    subscribers: subs.length,
    users: users.length,
    total: union.length,
    list: which === "subscribers" ? subs : which === "users" ? users : union,
  };
}

function buildMail(email, { perfume, subject, message }) {
  const unsubUrl = `${process.env.API_PUBLIC_URL}/api/subscribers/unsubscribe?token=${unsubToken(email)}`;
  const { html, text } = announcementEmail({
    perfume,
    headline: subject,
    message,
    shopUrl: `${process.env.SITE_URL}/shop`,
    unsubUrl,
  });
  return { to: email, subject, html, text, headers: { "List-Unsubscribe": `<${unsubUrl}>` } };
}

async function runJob(id, content, emails) {
  let sent = 0;
  let failed = 0;
  try {
    for (const email of emails) {
      try {
        await sendMail(buildMail(email, content));
        sent++;
      } catch (err) {
        failed++;
        console.error("announce: failed for one recipient:", err.message);
      }
      if ((sent + failed) % 5 === 0) {
        await pool.query("UPDATE announcements SET sent=$1, failed=$2 WHERE id=$3", [sent, failed, id]);
      }
      await sleep(250);
    }
    await pool.query(
      "UPDATE announcements SET sent=$1, failed=$2, status='done', finished_at=now() WHERE id=$3",
      [sent, failed, id]
    );
  } catch (err) {
    console.error("announce job crashed:", err);
    await pool.query(
      "UPDATE announcements SET sent=$1, failed=$2, status='failed', finished_at=now() WHERE id=$3",
      [sent, failed, id]
    );
  }
}

// Counts for each audience (+ whether this perfume was announced before)
router.get("/preview", async (req, res, next) => {
  try {
    const a = await audience();
    let alreadySentAt = null;
    const pid = Number(req.query.perfumeId);
    if (pid) {
      const r = await pool.query(
        "SELECT created_at FROM announcements WHERE perfume_id=$1 AND status<>'failed' ORDER BY id DESC LIMIT 1",
        [pid]
      );
      alreadySentAt = r.rows[0]?.created_at ?? null;
    }
    res.json({ subscribers: a.subscribers, users: a.users, total: a.total, alreadySentAt });
  } catch (err) {
    next(err);
  }
});

// Recent sends, newest first
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, perfume_id AS "perfumeId", subject, audience, total, sent, failed, status,
              created_at AS "createdAt", finished_at AS "finishedAt"
       FROM announcements ORDER BY id DESC LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/send", async (req, res, next) => {
  try {
    if (!mailerReady()) {
      return res.status(503).json({ error: "Email isn't set up on the server yet (SMTP settings are missing)." });
    }

    const which = req.body?.audience ?? "all";
    if (!AUDIENCES.has(which)) return res.status(400).json({ error: "Choose who should receive this." });

    // Perfume is optional
    let perfume = null;
    const perfumeId = Number(req.body?.perfumeId) || null;
    if (perfumeId) {
      // If these column names differ in your perfumes table, match them to perfumes.js
      const { rows } = await pool.query(
        `SELECT id, name, inspired_by AS "inspiredBy", description, image_url AS "imageUrl"
         FROM perfumes WHERE id = $1`,
        [perfumeId]
      );
      perfume = rows[0];
      if (!perfume) return res.status(404).json({ error: "Perfume not found." });
    }

    let subject = String(req.body?.subject ?? "").trim().slice(0, 120);
    let message = String(req.body?.message ?? "").trim().slice(0, 600);
    if (!subject) subject = perfume ? `New scent: ${perfume.name}` : DEFAULT_SUBJECT;
    if (!message && !perfume) message = DEFAULT_MESSAGE;
    const content = { perfume, subject, message };

    // Test: only the logged-in admin
    if (req.body?.testOnly) {
      const me = await pool.query("SELECT email FROM users WHERE id = $1", [req.user.id]);
      const to = me.rows[0]?.email;
      if (!to) return res.status(400).json({ error: "Your account has no email address." });
      await sendMail(buildMail(to, content));
      return res.json({ ok: true, to });
    }

    if (running) return res.status(409).json({ error: "A send is already in progress. Please wait for it to finish." });

    if (perfume && !req.body?.force) {
      const dup = await pool.query(
        "SELECT 1 FROM announcements WHERE perfume_id=$1 AND status<>'failed' LIMIT 1",
        [perfume.id]
      );
      if (dup.rows[0]) {
        return res.status(409).json({ error: "This perfume was already announced. Confirm to send again." });
      }
    }

    const a = await audience(which);
    if (!a.list.length) return res.status(400).json({ error: "There is nobody to send to in that group." });

    const ins = await pool.query(
      "INSERT INTO announcements (perfume_id, subject, audience, total) VALUES ($1,$2,$3,$4) RETURNING id",
      [perfume?.id ?? null, subject, which, a.list.length]
    );
    running = true;
    res.status(202).json({ id: ins.rows[0].id, total: a.list.length });
    runJob(ins.rows[0].id, content, a.list).finally(() => {
      running = false;
    });
  } catch (err) {
    next(err);
  }
});

export default router;