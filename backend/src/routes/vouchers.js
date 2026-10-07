import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Dates are entered as days. The last day counts in full, until 11:59 pm Manila time.
const STARTS = (n) => `($${n}::date)::timestamp AT TIME ZONE 'Asia/Manila'`;
const EXPIRES = (n) =>
  `(($${n}::date + 1)::timestamp AT TIME ZONE 'Asia/Manila') - interval '1 second'`;

const COLUMNS = `
  v.id, v.code, v.title, v.description,
  v.discount_type AS "discountType", v.discount_value::float8 AS "discountValue",
  v.min_spend::float8 AS "minSpend", v.max_uses AS "maxUses", v.used_count AS "usedCount",
  to_char(v.starts_at AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS "startsAt",
  to_char(v.expires_at AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS "expiresAt",
  v.is_active AS "isActive",
  CASE
    WHEN NOT v.is_active THEN 'inactive'
    WHEN v.expires_at IS NOT NULL AND v.expires_at < NOW() THEN 'expired'
    WHEN v.starts_at IS NOT NULL AND v.starts_at > NOW() THEN 'scheduled'
    WHEN v.max_uses IS NOT NULL AND v.used_count >= v.max_uses THEN 'used_up'
    ELSE 'active'
  END AS status`;

function fail(res, err) {
  if (err.code === "23505") return res.status(409).json({ error: "That code already exists." });
  if (err.code === "22007" || err.code === "22008")
    return res.status(400).json({ error: "One of the dates isn't valid." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
}

function problem(b, creating) {
  const has = (k) => creating || k in b;
  if (creating && !/^[A-Z0-9_-]{3,30}$/.test(String(b.code ?? "").trim().toUpperCase()))
    return "Enter a code of 3 to 30 letters, numbers, dashes, or underscores.";
  if (has("title") && !clean(b.title)) return "Enter a title.";
  if (!creating && ("discountType" in b) !== ("discountValue" in b))
    return "Send discountType and discountValue together.";
  if (has("discountType") && !["percent", "fixed"].includes(b.discountType))
    return "Choose percent or fixed.";
  if (has("discountValue")) {
    if (typeof b.discountValue !== "number" || !(b.discountValue > 0))
      return "Discount value must be more than 0.";
    if (b.discountType === "percent" && b.discountValue > 100)
      return "A percent discount can't be more than 100.";
  }
  if (b.minSpend != null && (typeof b.minSpend !== "number" || b.minSpend < 0))
    return "Minimum spend must be 0 or more.";
  if (b.maxUses != null && (!Number.isInteger(b.maxUses) || b.maxUses < 1))
    return "Max uses must be a whole number of 1 or more, or empty for unlimited.";
  if ("isActive" in b && typeof b.isActive !== "boolean") return "isActive must be true or false.";
  for (const k of ["startsAt", "expiresAt"])
    if (b[k] != null && !DATE.test(b[k])) return "Dates must look like 2026-11-03.";
  if (b.startsAt && b.expiresAt && b.expiresAt < b.startsAt)
    return "The end date can't be before the start date.";
  return null;
}

const fetchVoucher = async (id) =>
  (await pool.query(`SELECT ${COLUMNS} FROM vouchers v WHERE v.id = $1`, [id])).rows[0];

// ?month=2026-10 lists vouchers that are valid at some point in that month
router.get("/", async (req, res) => {
  const { month } = req.query;
  const params = [];
  let where = "";
  if (month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return res.status(400).json({ error: "Month must look like 2026-10." });
    params.push(`${month}-01`);
    where = `WHERE (v.starts_at IS NULL OR (v.starts_at AT TIME ZONE 'Asia/Manila') < ($1::date + interval '1 month'))
               AND (v.expires_at IS NULL OR (v.expires_at AT TIME ZONE 'Asia/Manila') >= $1::date)`;
  }
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM vouchers v ${where} ORDER BY v.created_at DESC, v.id DESC`, params);
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

router.get("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid voucher id." });
  try {
    const voucher = await fetchVoucher(id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found." });
    res.json(voucher);
  } catch (err) {
    fail(res, err);
  }
});

router.post("/", async (req, res) => {
  const b = req.body ?? {};
  const p = problem(b, true);
  if (p) return res.status(400).json({ error: p });
  try {
    const { rows } = await pool.query(
      `INSERT INTO vouchers
         (code, title, description, discount_type, discount_value, min_spend, max_uses, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${STARTS(8)}, ${EXPIRES(9)}) RETURNING id`,
      [String(b.code).trim().toUpperCase(), b.title.trim(), clean(b.description), b.discountType,
       b.discountValue, b.minSpend ?? 0, b.maxUses ?? null, b.startsAt ?? null, b.expiresAt ?? null]
    );
    res.status(201).json(await fetchVoucher(rows[0].id));
  } catch (err) {
    fail(res, err);
  }
});

// Edit, activate, or deactivate. The code itself can't change.
router.patch("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid voucher id." });
  const b = req.body ?? {};
  const p = problem(b, false);
  if (p) return res.status(400).json({ error: p });

  const sets = [];
  const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if ("title" in b) set("title", b.title.trim());
  if ("description" in b) set("description", clean(b.description));
  if ("discountType" in b) { set("discount_type", b.discountType); set("discount_value", b.discountValue); }
  if ("minSpend" in b) set("min_spend", b.minSpend ?? 0);
  if ("maxUses" in b) set("max_uses", b.maxUses ?? null);
  if ("isActive" in b) set("is_active", b.isActive);
  if ("startsAt" in b) { params.push(b.startsAt ?? null); sets.push(`starts_at = ${STARTS(params.length)}`); }
  if ("expiresAt" in b) { params.push(b.expiresAt ?? null); sets.push(`expires_at = ${EXPIRES(params.length)}`); }
  if (!sets.length) return res.status(400).json({ error: "Nothing to update." });

  params.push(id);
  try {
    const { rowCount } = await pool.query(
      `UPDATE vouchers SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    if (!rowCount) return res.status(404).json({ error: "Voucher not found." });
    res.json(await fetchVoucher(id));
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid voucher id." });
  try {
    const { rowCount } = await pool.query("DELETE FROM vouchers WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Voucher not found." });
    res.status(204).end();
  } catch (err) {
    if (err.code === "23503")
      return res.status(409).json({ error: "Orders already use this voucher. Deactivate it instead." });
    fail(res, err);
  }
});

export default router;