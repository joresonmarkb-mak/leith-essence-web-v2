import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);

router.get("/", async (req, res) => {
  let batchId = null;
  if (req.query.batchId !== undefined) {
    batchId = Number(req.query.batchId);
    if (!Number.isInteger(batchId) || batchId < 1)
      return res.status(400).json({ error: "batchId must be a number." });
  }
  const params = [batchId];

  try {
    const [owners, stock, sales, cash] = await Promise.all([
      pool.query(`SELECT id, name, user_id AS "userId" FROM owners ORDER BY id`),

      // Stock On Hand: one row per batch item the owner holds
      pool.query(
        `SELECT os.owner_id AS "ownerId", b.id AS "batchId", b.name AS "batchName",
                p.id AS "perfumeId", p.name AS "perfumeName", bi.size_ml AS "sizeMl",
                sa.quantity::int AS allocated,
                (sa.quantity - os.remaining)::int AS sold,
                os.remaining::int AS remaining,
                bi.cost_per_piece::float8 AS "costPerPiece",
                (os.remaining * bi.cost_per_piece)::float8 AS value
         FROM owner_stock os
         JOIN stock_allocations sa ON sa.batch_item_id = os.batch_item_id AND sa.owner_id = os.owner_id
         JOIN batch_items bi ON bi.id = os.batch_item_id
         JOIN batches b ON b.id = bi.batch_id
         JOIN perfumes p ON p.id = bi.perfume_id
         WHERE sa.quantity > 0 AND ($1::int IS NULL OR bi.batch_id = $1)
         ORDER BY p.name, bi.size_ml, b.id`, params),

      // Total Sales: paid and fulfilled orders, credited to the owner whose stock was used
      pool.query(
        `SELECT oi.owner_id AS "ownerId",
                SUM(oi.quantity)::int AS units,
                COUNT(DISTINCT oi.order_id)::int AS orders,
                SUM(oi.quantity * oi.unit_price)::float8 AS amount
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN batch_items bi ON bi.id = oi.batch_item_id
         WHERE o.status IN ('paid', 'fulfilled') AND oi.owner_id IS NOT NULL
           AND ($1::int IS NULL OR bi.batch_id = $1)
         GROUP BY oi.owner_id`, params),

      pool.query(
        `SELECT owner_id AS "ownerId",
                COALESCE(SUM(amount) FILTER (WHERE category = 'owner_contribution'), 0)::float8 AS contributed,
                COALESCE(SUM(amount) FILTER (WHERE category = 'owner_draw'), 0)::float8 AS drawn
         FROM cashflow_transactions
         WHERE owner_id IS NOT NULL AND category IN ('owner_contribution', 'owner_draw')
           AND ($1::int IS NULL OR batch_id = $1)
         GROUP BY owner_id`, params),
    ]);

    const cards = owners.rows.map((o) => {
      const items = stock.rows.filter((s) => s.ownerId === o.id).map(({ ownerId, ...s }) => s);
      const sale = sales.rows.find((s) => s.ownerId === o.id);
      const money = cash.rows.find((c) => c.ownerId === o.id);
      return {
        id: o.id,
        name: o.name,
        userId: o.userId,
        isMe: o.userId === req.user.id,
        stockValueHeld: r2(sum(items, "value")),
        unitsOnHand: sum(items, "remaining"),
        totalSales: sale?.units ?? 0, // pieces sold
        orders: sale?.orders ?? 0,
        salesAmount: r2(sale?.amount ?? 0),
        contributed: r2(money?.contributed ?? 0),
        drawn: r2(money?.drawn ?? 0),
        stock: items,
      };
    });

    res.json({
      batchId,
      owners: cards,
      totals: {
        stockValueHeld: r2(sum(cards, "stockValueHeld")),
        unitsOnHand: sum(cards, "unitsOnHand"),
        totalSales: sum(cards, "totalSales"),
        contributed: r2(sum(cards, "contributed")),
        drawn: r2(sum(cards, "drawn")),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

export default router;