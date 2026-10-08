import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Each category has one direction, so contributions and draws can't be entered with the wrong sign.
// "sale" entries are made automatically when an order's payment is confirmed.
const CATEGORY_TYPE = {
  supply_purchased: "out",
  shipping: "out",
  marketing: "out",
  owner_contribution: "in",
  owner_draw: "out",
  other: null,
};
const NEEDS_OWNER = ["owner_contribution", "owner_draw"];

const ENTRY_COLUMNS = `
  t.id, to_char(t.transaction_date, 'YYYY-MM-DD') AS date, t.type, t.category, t.description,
  t.amount::float8 AS amount, t.receipt_url AS "receiptUrl",
  t.owner_id AS "ownerId", ow.name AS "ownerName", t.batch_id AS "batchId", b.name AS "batchName",
  t.order_id AS "orderId", t.batch_expense_id AS "batchExpenseId",
  (t.order_id IS NULL AND t.batch_expense_id IS NULL) AS editable`;
const ENTRY_FROM = `
  FROM cashflow_transactions t
  LEFT JOIN owners ow ON ow.id = t.owner_id
  LEFT JOIN batches b ON b.id = t.batch_id`;

// amount is always positive; signedAmount is negative for cash out (shown as -P10,650.50)
const withSign = (e) => ({ ...e, signedAmount: e.type === "out" ? -e.amount : e.amount });

function fail(res, err) {
  if (err.code === "23503") return res.status(400).json({ error: "That owner or batch doesn't exist." });
  if (err.code === "22007" || err.code === "22008")
    return res.status(400).json({ error: "That date isn't valid." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
}

const fetchEntry = async (id) =>
  (await pool.query(`SELECT ${ENTRY_COLUMNS} ${ENTRY_FROM} WHERE t.id = $1`, [id])).rows[0];

// Cashflow page: ?month=2026-10&category=supply_purchased&type=out&ownerId=1&batchId=1
router.get("/", async (req, res) => {
  const { month, category, type, ownerId, batchId } = req.query;
  const where = [];
  const params = [];
  if (month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return res.status(400).json({ error: "Month must look like 2026-10." });
    params.push(`${month}-01`);
    const n = params.length;
    where.push(`t.transaction_date >= $${n}::date AND t.transaction_date < ($${n}::date + interval '1 month')`);
  }
  if (clean(category)) { params.push(clean(category)); where.push(`t.category = $${params.length}`); }
  if (clean(type)) { params.push(clean(type)); where.push(`t.type = $${params.length}`); }
  for (const [name, value, col] of [["ownerId", ownerId, "owner_id"], ["batchId", batchId, "batch_id"]]) {
    if (value === undefined) continue;
    const id = toId(value);
    if (!id) return res.status(400).json({ error: `${name} must be a number.` });
    params.push(id);
    where.push(`t.${col} = $${params.length}`);
  }
  const clause = where.length ? "WHERE " + where.join(" AND ") : "";
  try {
    const [list, sums] = await Promise.all([
      pool.query(
        `SELECT ${ENTRY_COLUMNS} ${ENTRY_FROM} ${clause}
         ORDER BY t.transaction_date DESC, t.id DESC LIMIT 500`, params),
      pool.query(
        `SELECT COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'in'), 0)::float8 AS "cashIn",
                COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'out'), 0)::float8 AS "cashOut"
         FROM cashflow_transactions t ${clause}`, params),
    ]);
    const { cashIn, cashOut } = sums.rows[0];
    res.json({
      entries: list.rows.map(withSign),
      summary: { cashIn: r2(cashIn), cashOut: r2(cashOut), net: r2(cashIn - cashOut) },
    });
  } catch (err) {
    fail(res, err);
  }
});

// + Add entry
router.post("/", async (req, res) => {
  const b = req.body ?? {};
  const { category } = b;
  if (category === "sale")
    return res.status(400).json({ error: "Sales are added automatically when you confirm an order's payment." });
  if (!Object.hasOwn(CATEGORY_TYPE, category))
    return res.status(400).json({ error: "Choose a category." });
  const type = CATEGORY_TYPE[category] ?? b.type;
  if (!["in", "out"].includes(type))
    return res.status(400).json({ error: "Choose cash in or cash out." });
  if (b.type && CATEGORY_TYPE[category] && b.type !== CATEGORY_TYPE[category])
    return res.status(400).json({ error: `${category} is always cash ${CATEGORY_TYPE[category]}.` });
  if (!clean(b.description)) return res.status(400).json({ error: "Enter a description." });
  if (typeof b.amount !== "number" || !(b.amount > 0))
    return res.status(400).json({ error: "Amount must be more than 0." });
  if (b.date != null && !DATE.test(b.date))
    return res.status(400).json({ error: "Date must look like 2026-10-07." });
  const ownerId = b.ownerId == null ? null : toId(b.ownerId);
  const batchId = b.batchId == null ? null : toId(b.batchId);
  if ((b.ownerId != null && !ownerId) || (b.batchId != null && !batchId))
    return res.status(400).json({ error: "ownerId and batchId must be numbers." });
  if (NEEDS_OWNER.includes(category) && !ownerId)
    return res.status(400).json({ error: "Choose which owner this contribution or draw belongs to." });

  try {
    const { rows } = await pool.query(
      `INSERT INTO cashflow_transactions
         (transaction_date, type, category, description, amount, receipt_url, owner_id, batch_id)
       VALUES (COALESCE($1::date, (NOW() AT TIME ZONE 'Asia/Manila')::date), $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [b.date ?? null, type, category, clean(b.description), b.amount, clean(b.receiptUrl), ownerId, batchId]
    );
    res.status(201).json(withSign(await fetchEntry(rows[0].id)));
  } catch (err) {
    fail(res, err);
  }
});

// Edit an entry you added by hand. Sales and batch expenses are changed at their source.
router.patch("/:id", async (req, res) => {
  const id = toId(req.params.id);
  const b = req.body ?? {};
  if (!id) return res.status(400).json({ error: "Invalid entry id." });
  try {
    const { rows } = await pool.query(
      "SELECT category, order_id, batch_expense_id FROM cashflow_transactions WHERE id = $1", [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Entry not found." });
    if (row.order_id || row.batch_expense_id)
      return res.status(409).json({ error: "This entry comes from an order or a batch expense. Change it there." });

    const sets = [];
    const params = [];
    const set = (sql, val) => { params.push(val); sets.push(sql.replace("?", `$${params.length}`)); };
    if ("date" in b) {
      if (!DATE.test(b.date)) return res.status(400).json({ error: "Date must look like 2026-10-07." });
      set("transaction_date = ?::date", b.date);
    }
    if ("description" in b) {
      if (!clean(b.description)) return res.status(400).json({ error: "Enter a description." });
      set("description = ?", clean(b.description));
    }
    if ("amount" in b) {
      if (typeof b.amount !== "number" || !(b.amount > 0))
        return res.status(400).json({ error: "Amount must be more than 0." });
      set("amount = ?", b.amount);
    }
    if ("receiptUrl" in b) set("receipt_url = ?", clean(b.receiptUrl));
    if ("batchId" in b) {
      const v = b.batchId == null ? null : toId(b.batchId);
      if (b.batchId != null && !v) return res.status(400).json({ error: "batchId must be a number." });
      set("batch_id = ?", v);
    }
    if ("ownerId" in b) {
      const v = b.ownerId == null ? null : toId(b.ownerId);
      if (b.ownerId != null && !v) return res.status(400).json({ error: "ownerId must be a number." });
      if (!v && NEEDS_OWNER.includes(row.category))
        return res.status(400).json({ error: "Contributions and draws need an owner." });
      set("owner_id = ?", v);
    }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });

    params.push(id);
    await pool.query(`UPDATE cashflow_transactions SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json(withSign(await fetchEntry(id)));
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid entry id." });
  try {
    const { rows } = await pool.query(
      "SELECT order_id, batch_expense_id FROM cashflow_transactions WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Entry not found." });
    if (rows[0].order_id || rows[0].batch_expense_id)
      return res.status(409).json({ error: "Delete the batch expense or cancel the order instead." });
    await pool.query("DELETE FROM cashflow_transactions WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    fail(res, err);
  }
});

export default router;