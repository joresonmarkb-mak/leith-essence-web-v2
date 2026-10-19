import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Client confirms they received their own shipped order
router.patch("/:id/received", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad order id" });

  const r = await pool.query(
    `UPDATE orders SET received_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'fulfilled' AND received_at IS NULL
     RETURNING id, received_at AS "receivedAt"`,
    [id, req.user.id]
  );
  if (r.rowCount) return res.json(r.rows[0]);

  const o = await pool.query(
    `SELECT received_at AS "receivedAt" FROM orders WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  if (!o.rowCount) return res.status(404).json({ error: "Order not found" });
  if (o.rows[0].receivedAt) return res.json({ id, receivedAt: o.rows[0].receivedAt }); // already confirmed
  res.status(409).json({ error: "This order hasn't shipped yet." });
});

export default router;