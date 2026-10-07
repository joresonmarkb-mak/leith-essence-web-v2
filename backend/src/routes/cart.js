import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { SIZES_CTE } from "../lib/shopQueries.js";

const router = Router();
router.use(requireAuth);

const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// The cart stores no prices. Every read shows today's price and stock.
const CART_SQL = `${SIZES_CTE}
  SELECT c.id, c.perfume_id AS "perfumeId", p.name, p.inspired_by AS "inspiredBy", p.category,
         p.image_url AS "imageUrl", c.size_ml AS "sizeMl", c.quantity,
         s.price AS "unitPrice", COALESCE(s.available, 0) AS available
  FROM cart_items c
  JOIN perfumes p ON p.id = c.perfume_id
  LEFT JOIN sizes s ON s.perfume_id = c.perfume_id AND s.size_ml = c.size_ml
  WHERE c.user_id = $1 ORDER BY c.id`;

async function loadCart(userId) {
  const { rows } = await pool.query(CART_SQL, [userId]);
  const items = rows.map((r) => ({
    ...r,
    inStock: r.available >= r.quantity,
    lineTotal: r.unitPrice == null ? 0 : r2(r.unitPrice * r.quantity),
  }));
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: r2(items.reduce((s, i) => s + i.lineTotal, 0)),
  };
}

router.get("/", async (req, res) => {
  try {
    res.json(await loadCart(req.user.id));
  } catch (err) {
    fail(res, err);
  }
});

// Add to bag (adds to the quantity if it's already there)
router.post("/", async (req, res) => {
  const perfumeId = toId(req.body?.perfumeId);
  const sizeMl = toId(req.body?.sizeMl);
  const quantity = req.body?.quantity === undefined ? 1 : Number(req.body.quantity);
  if (!perfumeId || !sizeMl) return res.status(400).json({ error: "Choose a perfume and a size." });
  if (!Number.isInteger(quantity) || quantity < 1)
    return res.status(400).json({ error: "Quantity must be at least 1." });
  try {
    const { rows } = await pool.query(
      `${SIZES_CTE}
       SELECT s.available,
              COALESCE((SELECT quantity FROM cart_items
                        WHERE user_id = $1 AND perfume_id = $2 AND size_ml = $3), 0) AS "inCart"
       FROM sizes s WHERE s.perfume_id = $2 AND s.size_ml = $3 AND s.available > 0`,
      [req.user.id, perfumeId, sizeMl]
    );
    if (!rows[0]) return res.status(409).json({ error: "That perfume and size is out of stock." });
    const { available, inCart } = rows[0];
    const total = inCart + quantity;
    if (total > available)
      return res.status(409).json({
        error: `Only ${available} left${inCart ? `, and you already have ${inCart} in your bag` : ""}.`,
      });
    await pool.query(
      `INSERT INTO cart_items (user_id, perfume_id, size_ml, quantity) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, perfume_id, size_ml) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [req.user.id, perfumeId, sizeMl, total]
    );
    res.status(201).json(await loadCart(req.user.id));
  } catch (err) {
    fail(res, err);
  }
});

// Change the quantity (the - and + in the bag)
router.patch("/:id", async (req, res) => {
  const id = toId(req.params.id);
  const quantity = Number(req.body?.quantity);
  if (!id) return res.status(400).json({ error: "Invalid item id." });
  if (!Number.isInteger(quantity) || quantity < 1)
    return res.status(400).json({ error: "Quantity must be at least 1. Remove the item instead." });
  try {
    const { rows } = await pool.query(
      `${SIZES_CTE}
       SELECT c.id, COALESCE(s.available, 0) AS available
       FROM cart_items c
       LEFT JOIN sizes s ON s.perfume_id = c.perfume_id AND s.size_ml = c.size_ml
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found in your bag." });
    if (quantity > rows[0].available)
      return res.status(409).json({
        error: rows[0].available ? `Only ${rows[0].available} left.` : "That perfume and size is out of stock.",
      });
    await pool.query("UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3",
      [quantity, id, req.user.id]);
    res.json(await loadCart(req.user.id));
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid item id." });
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (!rowCount) return res.status(404).json({ error: "Item not found in your bag." });
    res.json(await loadCart(req.user.id));
  } catch (err) {
    fail(res, err);
  }
});

export default router;