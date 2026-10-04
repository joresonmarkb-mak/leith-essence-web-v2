import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const isPositive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const r2 = (n) => Math.round(n * 100) / 100;
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

// Sold out is worked out from the numbers, never stored
function effectiveStatus(stored, produced, sold) {
  if (stored === "closed") return "closed";
  if (produced > 0 && produced - sold <= 0) return "sold_out";
  return "active";
}

const CATEGORY = { material: "supply_purchased", other: "other" };
function checkExpense(b) {
  if (!["material", "other"].includes(b.type)) return "Choose material or other.";
  if (!b.description?.trim()) return "Enter a description.";
  if (!isPositive(b.quantity)) return "Quantity must be more than 0.";
  if (!isPositive(b.unitPrice)) return "Price per unit must be more than 0.";
  return null;
}

// ---------- Batches ----------

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.name, b.batch_date AS "batchDate", b.created_at AS "createdAt",
             b.status AS stored,
             COALESCE(p.produced, 0)::int AS produced,
             COALESCE(s.sold, 0)::int AS sold
      FROM batches b
      LEFT JOIN (
        SELECT batch_id, SUM(quantity_produced) AS produced
        FROM batch_items GROUP BY batch_id
      ) p ON p.batch_id = b.id
      LEFT JOIN (
        SELECT bi.batch_id, SUM(oi.quantity) AS sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'fulfilled')
        JOIN batch_items bi ON bi.id = oi.batch_item_id
        GROUP BY bi.batch_id
      ) s ON s.batch_id = b.id
      ORDER BY b.batch_date DESC, b.id DESC`);
    res.json(rows.map(({ stored, ...b }) => ({
      ...b, status: effectiveStatus(stored, b.produced, b.sold),
    })));
  } catch (err) {
    fail(res, err);
  }
});

// Prefill for "add perfume": cost and price from the latest batch that had it
router.get("/items/latest", async (req, res) => {
  const perfumeId = toId(req.query.perfumeId);
  const sizeMl = toId(req.query.sizeMl);
  if (!perfumeId || !sizeMl) return res.status(400).json({ error: "Send perfumeId and sizeMl." });
  try {
    const { rows } = await pool.query(
      `SELECT bi.cost_per_piece::float8 AS "costPerPiece",
              bi.selling_price::float8 AS "sellingPrice", b.name AS "batchName"
       FROM batch_items bi JOIN batches b ON b.id = bi.batch_id
       WHERE bi.perfume_id = $1 AND bi.size_ml = $2
       ORDER BY b.batch_date DESC, bi.id DESC LIMIT 1`,
      [perfumeId, sizeMl]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    fail(res, err);
  }
});

// The batch dashboard: batch + stats + perfumes + materials
router.get("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid batch id." });
  try {
    const [b, ex, it, al] = await Promise.all([
      pool.query(
        `SELECT id, name, batch_date AS "batchDate", notes, created_at AS "createdAt",
                status AS stored FROM batches WHERE id = $1`, [id]),
      pool.query(
        `SELECT id, type, description, quantity::float8 AS quantity,
                unit_price::float8 AS "unitPrice", total_cost::float8 AS "totalCost",
                receipt_url AS "receiptUrl"
         FROM batch_expenses WHERE batch_id = $1 ORDER BY id`, [id]),
      pool.query(
        `SELECT bi.id, bi.perfume_id AS "perfumeId", p.name, p.category,
                p.inspired_by AS "inspiredBy", p.image_url AS "imageUrl",
                bi.size_ml AS "sizeMl", bi.quantity_produced AS "quantityProduced",
                bi.cost_per_piece::float8 AS "costPerPiece",
                bi.selling_price::float8 AS "sellingPrice", bi.is_active AS "isActive",
                COALESCE(s.sold, 0)::int AS sold,
                (bi.quantity_produced - COALESCE(s.sold, 0))::int AS remaining,
                COALESCE(s.revenue, 0)::float8 AS revenue
         FROM batch_items bi
         JOIN perfumes p ON p.id = bi.perfume_id
         LEFT JOIN (
           SELECT oi.batch_item_id, SUM(oi.quantity) AS sold,
                  SUM(oi.quantity * oi.unit_price) AS revenue
           FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE o.status IN ('paid', 'fulfilled') AND oi.batch_item_id IS NOT NULL
           GROUP BY oi.batch_item_id
         ) s ON s.batch_item_id = bi.id
         WHERE bi.batch_id = $1 ORDER BY p.name, bi.size_ml`, [id]),
      pool.query(
        `SELECT sa.batch_item_id AS "batchItemId", sa.owner_id AS "ownerId",
                o.name AS "ownerName", sa.quantity
         FROM stock_allocations sa
         JOIN owners o ON o.id = sa.owner_id
         JOIN batch_items bi ON bi.id = sa.batch_item_id
         WHERE bi.batch_id = $1`, [id]),
    ]);
    if (!b.rows[0]) return res.status(404).json({ error: "Batch not found." });

    const expenses = ex.rows;
    const items = it.rows.map((i) => ({
      ...i,
      allocations: al.rows
        .filter((a) => a.batchItemId === i.id)
        .map(({ batchItemId, ...a }) => a),
    }));

    const totalExpenses = sum(expenses, (e) => e.totalCost);
    const produced = sum(items, (i) => i.quantityProduced);
    const sold = sum(items, (i) => i.sold);
    const revenue = sum(items, (i) => i.revenue);
    const costOfSold = sum(items, (i) => i.sold * i.costPerPiece);
    const { stored, ...batch } = b.rows[0];

    res.json({
      ...batch,
      status: effectiveStatus(stored, produced, sold),
      stats: {
        totalExpenses: r2(totalExpenses),
        unitsProduced: produced,
        unitsSold: sold,
        unitsRemaining: produced - sold,
        revenue: r2(revenue),
        profit: r2(revenue - costOfSold),          // revenue minus the cost of the bottles sold
        netPosition: r2(revenue - totalExpenses),  // revenue minus everything spent so far
        inventoryValue: r2(sum(items, (i) => i.remaining * i.costPerPiece)),
        costPerPiece: produced ? r2(totalExpenses / produced) : 0,
      },
      items,
      expenses,
    });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/", async (req, res) => {
  const { name, batchDate, notes } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Enter a batch name." });
  try {
    const { rows } = await pool.query(
      `INSERT INTO batches (name, batch_date, notes)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3)
       RETURNING id, name, batch_date AS "batchDate", notes`,
      [name.trim(), batchDate || null, notes || null]
    );
    res.status(201).json({ ...rows[0], status: "active" });
  } catch (err) {
    fail(res, err);
  }
});

router.patch("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid batch id." });
  const { name, batchDate, notes, status } = req.body ?? {};
  if (status !== undefined && !["active", "closed"].includes(status)) {
    return res.status(400).json({ error: "Status can be active or closed. Sold out is set automatically." });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE batches
       SET name = COALESCE($1, name), batch_date = COALESCE($2::date, batch_date),
           notes = COALESCE($3, notes), status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, name, batch_date AS "batchDate", notes, status`,
      [name?.trim() || null, batchDate || null, notes ?? null, status ?? null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Batch not found." });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid batch id." });
  try {
    const { rowCount } = await pool.query("DELETE FROM batches WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Batch not found." });
    res.status(204).end();
  } catch (err) {
    if (err.code === "23503")
      return res.status(409).json({ error: "Orders already use this batch. Close it instead." });
    fail(res, err);
  }
});

// ---------- Expenses (each one also writes a cashflow entry) ----------

router.post("/:id/expenses", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid batch id." });
  const b = req.body ?? {};
  const problem = checkExpense(b);
  if (problem) return res.status(400).json({ error: problem });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO batch_expenses (batch_id, type, description, quantity, unit_price, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, description, quantity::float8 AS quantity,
                 unit_price::float8 AS "unitPrice", total_cost::float8 AS "totalCost",
                 receipt_url AS "receiptUrl"`,
      [id, b.type, b.description.trim(), b.quantity, b.unitPrice, b.receiptUrl || null]
    );
    await client.query(
      `INSERT INTO cashflow_transactions
         (transaction_date, type, category, description, amount, receipt_url,
          owner_id, batch_id, batch_expense_id)
       SELECT COALESCE($1::date, CURRENT_DATE), 'out', $2::varchar, description,
              total_cost, receipt_url, $3::int, batch_id, id
       FROM batch_expenses WHERE id = $4`,
      [b.date || null, CATEGORY[b.type], b.paidByOwnerId ?? null, rows[0].id]
    );
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return res.status(404).json({ error: "Batch or owner not found." });
    fail(res, err);
  } finally {
    client.release();
  }
});

router.put("/:id/expenses/:expenseId", async (req, res) => {
  const id = toId(req.params.id);
  const expenseId = toId(req.params.expenseId);
  if (!id || !expenseId) return res.status(400).json({ error: "Invalid id." });
  const b = req.body ?? {};
  const problem = checkExpense(b);
  if (problem) return res.status(400).json({ error: problem });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE batch_expenses
       SET type = $1, description = $2, quantity = $3, unit_price = $4, receipt_url = $5
       WHERE id = $6 AND batch_id = $7
       RETURNING id, type, description, quantity::float8 AS quantity,
                 unit_price::float8 AS "unitPrice", total_cost::float8 AS "totalCost",
                 receipt_url AS "receiptUrl"`,
      [b.type, b.description.trim(), b.quantity, b.unitPrice, b.receiptUrl || null, expenseId, id]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Expense not found." });
    }
    await client.query(
      `UPDATE cashflow_transactions
       SET category = $1, description = $2, receipt_url = $3,
           amount = (SELECT total_cost FROM batch_expenses WHERE id = $4)
       WHERE batch_expense_id = $4`,
      [CATEGORY[b.type], b.description.trim(), b.receiptUrl || null, expenseId]
    );
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    fail(res, err);
  } finally {
    client.release();
  }
});

router.delete("/:id/expenses/:expenseId", async (req, res) => {
  const id = toId(req.params.id);
  const expenseId = toId(req.params.expenseId);
  if (!id || !expenseId) return res.status(400).json({ error: "Invalid id." });
  try {
    // the matching cashflow entry is removed automatically (ON DELETE CASCADE)
    const { rowCount } = await pool.query(
      "DELETE FROM batch_expenses WHERE id = $1 AND batch_id = $2", [expenseId, id]);
    if (!rowCount) return res.status(404).json({ error: "Expense not found." });
    res.status(204).end();
  } catch (err) {
    fail(res, err);
  }
});

// ---------- Perfumes in a batch ----------

router.post("/:id/items", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid batch id." });
  const { perfumeId, sizeMl, quantityProduced, costPerPiece, sellingPrice, allocations } = req.body ?? {};

  if (!toId(perfumeId)) return res.status(400).json({ error: "Choose a perfume." });
  if (!toId(sizeMl)) return res.status(400).json({ error: "Enter the size in ml." });
  if (!Number.isInteger(quantityProduced) || quantityProduced <= 0)
    return res.status(400).json({ error: "Enter how many were made." });
  if (!isPositive(costPerPiece)) return res.status(400).json({ error: "Enter the cost per piece." });
  if (!isPositive(sellingPrice)) return res.status(400).json({ error: "Enter the selling price." });

  const split = Array.isArray(allocations) ? allocations : [];
  const valid = split.length > 0 && split.every(
    (a) => toId(a.ownerId) && Number.isInteger(a.quantity) && a.quantity >= 0);
  if (!valid || new Set(split.map((a) => a.ownerId)).size !== split.length)
    return res.status(400).json({ error: "Split the stock between owners, one entry per owner." });
  if (sum(split, (a) => a.quantity) !== quantityProduced)
    return res.status(400).json({ error: "The owners' pieces must add up to the number made." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO batch_items (batch_id, perfume_id, size_ml, quantity_produced, cost_per_piece, selling_price)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [id, perfumeId, sizeMl, quantityProduced, costPerPiece, sellingPrice]
    );
    await client.query(
      `INSERT INTO stock_allocations (batch_item_id, owner_id, quantity)
       SELECT $1, t.owner_id, t.qty
       FROM unnest($2::int[], $3::int[]) AS t(owner_id, qty)
       WHERE t.qty > 0`,
      [rows[0].id, split.map((a) => a.ownerId), split.map((a) => a.quantity)]
    );
    await client.query("COMMIT");
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res.status(409).json({ error: "That perfume and size is already in this batch." });
    if (err.code === "23503")
      return res.status(400).json({ error: "The batch, perfume, or an owner doesn't exist." });
    fail(res, err);
  } finally {
    client.release();
  }
});

// Edit price/cost, or Activate / Deactivate
router.patch("/:id/items/:itemId", async (req, res) => {
  const id = toId(req.params.id);
  const itemId = toId(req.params.itemId);
  if (!id || !itemId) return res.status(400).json({ error: "Invalid id." });
  const { costPerPiece, sellingPrice, isActive } = req.body ?? {};
  if (costPerPiece !== undefined && !isPositive(costPerPiece))
    return res.status(400).json({ error: "Cost per piece must be more than 0." });
  if (sellingPrice !== undefined && !isPositive(sellingPrice))
    return res.status(400).json({ error: "Selling price must be more than 0." });
  if (isActive !== undefined && typeof isActive !== "boolean")
    return res.status(400).json({ error: "isActive must be true or false." });
  try {
    const { rows } = await pool.query(
      `UPDATE batch_items
       SET cost_per_piece = COALESCE($1, cost_per_piece),
           selling_price = COALESCE($2, selling_price),
           is_active = COALESCE($3, is_active)
       WHERE id = $4 AND batch_id = $5
       RETURNING id, cost_per_piece::float8 AS "costPerPiece",
                 selling_price::float8 AS "sellingPrice", is_active AS "isActive"`,
      [costPerPiece ?? null, sellingPrice ?? null, isActive ?? null, itemId, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found in this batch." });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id/items/:itemId", async (req, res) => {
  const id = toId(req.params.id);
  const itemId = toId(req.params.itemId);
  if (!id || !itemId) return res.status(400).json({ error: "Invalid id." });
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM batch_items WHERE id = $1 AND batch_id = $2", [itemId, id]);
    if (!rowCount) return res.status(404).json({ error: "Item not found in this batch." });
    res.status(204).end();
  } catch (err) {
    if (err.code === "23503")
      return res.status(409).json({ error: "Orders already use this item. Deactivate it instead." });
    fail(res, err);
  }
});

export default router;