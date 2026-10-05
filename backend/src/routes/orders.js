import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError, lockOrders, priceOrder, createOrder, confirmPayment } from "../lib/orderLogic.js";

const router = Router();

const PLATFORMS = ["website", "facebook", "instagram", "tiktok", "shopee", "events"];
const PAYMENTS = ["gcash", "qrph", "cash", "other"];
const TRANSITIONS = { pending: ["paid", "cancelled"], paid: ["fulfilled", "cancelled"], fulfilled: [], cancelled: [] };

const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

function handle(res, err) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === "23514")
    return res.status(400).json({ error: "Some order details are missing or invalid. Check them and try again." });
  if (err.code === "23503")
    return res.status(400).json({ error: "A perfume, owner, or voucher in this order doesn't exist." });
  if (err.code === "22001")
    return res.status(400).json({ error: "One of the fields is too long." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await lockOrders(client);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const ORDER_SQL = `
  SELECT o.id, o.user_id AS "userId", o.buyer_name AS "buyerName", o.buyer_phone AS "buyerPhone",
         o.buyer_email AS "buyerEmail", o.province, o.city, o.barangay, o.street,
         o.type, o.status, o.platform, o.payment_method AS "paymentMethod",
         o.payment_reference AS "paymentReference", o.receipt_url AS "receiptUrl",
         o.subtotal::float8 AS subtotal, o.shipping_fee::float8 AS "shippingFee",
         o.discount::float8 AS discount, o.total::float8 AS total, o.notes,
         o.tracking_number AS "trackingNumber", o.created_at AS "createdAt",
         o.paid_at AS "paidAt", o.fulfilled_at AS "fulfilledAt", v.code AS "voucherCode"
  FROM orders o LEFT JOIN vouchers v ON v.id = o.voucher_id
  WHERE o.id = $1`;

const ITEMS_SQL = `
  SELECT oi.id, oi.perfume_id AS "perfumeId", p.name, p.inspired_by AS "inspiredBy",
         p.category, p.image_url AS "imageUrl", oi.size_ml AS "sizeMl", oi.quantity,
         oi.unit_price::float8 AS "unitPrice", oi.batch_item_id AS "batchItemId",
         oi.owner_id AS "ownerId", ow.name AS "ownerName", b.name AS "batchName"
  FROM order_items oi
  JOIN perfumes p ON p.id = oi.perfume_id
  LEFT JOIN owners ow ON ow.id = oi.owner_id
  LEFT JOIN batch_items bi ON bi.id = oi.batch_item_id
  LEFT JOIN batches b ON b.id = bi.batch_id
  WHERE oi.order_id = $1 ORDER BY oi.id`;

const LIST_SQL = `
  SELECT o.id, o.buyer_name AS "buyerName", o.type, o.status, o.platform,
         o.total::float8 AS total, o.created_at AS "createdAt",
         concat_ws(', ', o.barangay, o.city, o.province) AS address,
         (SELECT COALESCE(json_agg(x ORDER BY x.name, x."sizeMl"), '[]')
          FROM (SELECT p.name, oi.size_ml AS "sizeMl", SUM(oi.quantity)::int AS quantity
                FROM order_items oi JOIN perfumes p ON p.id = oi.perfume_id
                WHERE oi.order_id = o.id GROUP BY p.name, oi.size_ml) x) AS items
  FROM orders o`;

async function fetchOrder(db, id) {
  const [o, it] = await Promise.all([db.query(ORDER_SQL, [id]), db.query(ITEMS_SQL, [id])]);
  return o.rows[0] ? { ...o.rows[0], items: it.rows } : null;
}

// Customers never see which owner or batch the stock came from
function forCustomer(o) {
  const { notes, userId, ...rest } = o;
  return {
    ...rest,
    items: o.items.map(({ batchItemId, ownerId, ownerName, batchName, ...i }) => i),
  };
}

// ---------- Customer ----------

// Checkout "Apply" button: shows the totals without creating an order
router.post("/preview", requireAuth, async (req, res) => {
  try {
    const { items, voucherCode } = req.body ?? {};
    const p = await priceOrder(pool, { items, voucherCode, type: "shipping", checkAvailability: true });
    res.json({
      lines: p.lines.map(({ perfumeId, sizeMl, quantity, name, unitPrice }) => ({
        perfumeId, sizeMl, quantity, name, unitPrice,
      })),
      subtotal: p.subtotal, shipping: p.shipping, discount: p.discount, total: p.total,
      voucher: p.voucher ? { code: p.voucher.code, title: p.voucher.title } : null,
    });
  } catch (err) {
    handle(res, err);
  }
});

// "Pay and place order"
router.post("/checkout", requireAuth, async (req, res) => {
  const b = req.body ?? {};
  const f = {
    firstName: clean(b.firstName), lastName: clean(b.lastName),
    phone: clean(b.phone), email: clean(b.email),
    province: clean(b.province), city: clean(b.city),
    barangay: clean(b.barangay), street: clean(b.street),
  };
  if (Object.values(f).some((v) => !v))
    return res.status(400).json({ error: "Complete your personal and shipping information." });
  const paymentReference = clean(b.paymentReference);
  const receiptUrl = clean(b.receiptUrl);
  if (!paymentReference) return res.status(400).json({ error: "Enter the GCash reference number." });
  if (!receiptUrl) return res.status(400).json({ error: "Upload your proof of payment." });

  try {
    const orderId = await withTx(async (client) => {
      const created = await createOrder(client, {
        pricing: { items: b.items, voucherCode: b.voucherCode, checkAvailability: true },
        order: {
          userId: req.user.id, buyerName: `${f.firstName} ${f.lastName}`,
          buyerPhone: f.phone, buyerEmail: f.email,
          province: f.province, city: f.city, barangay: f.barangay, street: f.street,
          type: "shipping", platform: "website", paymentMethod: "gcash",
          paymentReference, receiptUrl,
        },
      });
      // remove what was just bought from the cart
      await client.query(
        `DELETE FROM cart_items c USING unnest($2::int[], $3::int[]) AS t(pid, sz)
         WHERE c.user_id = $1 AND c.perfume_id = t.pid AND c.size_ml = t.sz`,
        [req.user.id, created.priced.lines.map((l) => l.perfumeId), created.priced.lines.map((l) => l.sizeMl)]
      );
      return created.orderId;
    });
    res.status(201).json(forCustomer(await fetchOrder(pool, orderId)));
  } catch (err) {
    handle(res, err);
  }
});

// My orders page
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 100",
      [req.user.id]
    );
    const orders = await Promise.all(rows.map((r) => fetchOrder(pool, r.id)));
    res.json(orders.map(forCustomer));
  } catch (err) {
    handle(res, err);
  }
});

// ---------- Admin ----------

// Orders page: ?month=2026-10&status=pending&platform=facebook&q=maria
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { month, status, platform, q } = req.query;
  const where = [];
  const params = [];
  if (month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return res.status(400).json({ error: "Month must look like 2026-10." });
    params.push(`${month}-01`);
    const n = params.length;
    where.push(`(o.created_at AT TIME ZONE 'Asia/Manila') >= $${n}::date
                AND (o.created_at AT TIME ZONE 'Asia/Manila') < ($${n}::date + interval '1 month')`);
  }
  if (clean(status)) { params.push(clean(status)); where.push(`o.status = $${params.length}`); }
  if (clean(platform)) { params.push(clean(platform)); where.push(`o.platform = $${params.length}`); }
  if (clean(q)) { params.push(`%${clean(q)}%`); where.push(`o.buyer_name ILIKE $${params.length}`); }
  try {
    const { rows } = await pool.query(
      `${LIST_SQL} ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY o.created_at DESC, o.id DESC LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (err) {
    handle(res, err);
  }
});

// Add order (orders from Facebook, IG, TikTok, Shopee, events)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const b = req.body ?? {};
  const buyerName = clean(b.buyerName);
  const type = b.type ?? "shipping";
  const status = b.status ?? "paid";
  const ownerId = toId(b.ownerId);

  if (!buyerName) return res.status(400).json({ error: "Enter the buyer's name." });
  if (!["shipping", "pickup"].includes(type))
    return res.status(400).json({ error: "Type must be shipping or pickup." });
  if (!PLATFORMS.includes(b.platform))
    return res.status(400).json({ error: "Choose where the order was sold." });
  if (!PAYMENTS.includes(b.paymentMethod))
    return res.status(400).json({ error: "Choose how it was paid." });
  if (b.platform === "website" && b.paymentMethod !== "gcash")
    return res.status(400).json({ error: "Website orders are paid by GCash." });
  if (!["pending", "paid", "fulfilled"].includes(status))
    return res.status(400).json({ error: "Status must be pending, paid, or fulfilled." });
  if (status !== "pending" && !ownerId)
    return res.status(400).json({ error: "Choose which owner sold it." });
  if (b.shippingFee != null && !(typeof b.shippingFee === "number" && b.shippingFee >= 0))
    return res.status(400).json({ error: "Shipping fee must be 0 or more." });

  const address = {
    province: clean(b.province), city: clean(b.city),
    barangay: clean(b.barangay), street: clean(b.street),
  };
  if (type === "shipping" && Object.values(address).some((v) => !v))
    return res.status(400).json({ error: "Enter the full shipping address: province, city, barangay, and street." });

  try {
    const orderId = await withTx(async (client) => {
      const { orderId } = await createOrder(client, {
        pricing: { items: b.items, voucherCode: b.voucherCode, shippingFee: b.shippingFee, allowPrice: true },
        order: {
          buyerName, buyerPhone: clean(b.buyerPhone), buyerEmail: clean(b.buyerEmail),
          ...address, type, platform: b.platform, paymentMethod: b.paymentMethod,
          paymentReference: clean(b.paymentReference), receiptUrl: clean(b.receiptUrl),
          notes: clean(b.notes),
        },
      });
      if (status !== "pending") {
        await confirmPayment(client, orderId, {
          ownerId, receivedByOwnerId: toId(b.receivedByOwnerId) ?? ownerId,
        });
        if (status === "fulfilled") {
          await client.query(
            "UPDATE orders SET status = 'fulfilled', fulfilled_at = NOW(), tracking_number = $2 WHERE id = $1",
            [orderId, clean(b.trackingNumber)]
          );
        }
      }
      return orderId;
    });
    res.status(201).json(await fetchOrder(pool, orderId));
  } catch (err) {
    handle(res, err);
  }
});

// Order details: admin sees any order, a customer only their own
router.get("/:id", requireAuth, async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid order id." });
  try {
    const order = await fetchOrder(pool, id);
    const isAdmin = req.user.role === "admin";
    if (!order || (!isAdmin && order.userId !== req.user.id))
      return res.status(404).json({ error: "Order not found." });
    res.json(isAdmin ? order : forCustomer(order));
  } catch (err) {
    handle(res, err);
  }
});

// Confirm payment, mark fulfilled, or cancel
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  const { status, ownerId, receivedByOwnerId, trackingNumber } = req.body ?? {};
  if (!id) return res.status(400).json({ error: "Invalid order id." });
  if (!["paid", "fulfilled", "cancelled"].includes(status))
    return res.status(400).json({ error: "Choose paid, fulfilled, or cancelled." });

  try {
    await withTx(async (client) => {
      const { rows } = await client.query(
        "SELECT id, status, voucher_id FROM orders WHERE id = $1 FOR UPDATE", [id]);
      const order = rows[0];
      if (!order) throw new HttpError(404, "Order not found.");
      if (!TRANSITIONS[order.status].includes(status))
        throw new HttpError(409, `A ${order.status} order can't be changed to ${status}.`);

      if (status === "paid") {
        await confirmPayment(client, id, {
          ownerId: toId(ownerId), receivedByOwnerId: toId(receivedByOwnerId),
        });
      } else if (status === "fulfilled") {
        await client.query(
          `UPDATE orders SET status = 'fulfilled', fulfilled_at = NOW(),
                  tracking_number = COALESCE($2, tracking_number) WHERE id = $1`,
          [id, clean(trackingNumber)]
        );
      } else {
        await client.query("DELETE FROM cashflow_transactions WHERE order_id = $1 AND category = 'sale'", [id]);
        if (order.voucher_id)
          await client.query("UPDATE vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE id = $1", [order.voucher_id]);
        await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id]);
      }
    });
    res.json(await fetchOrder(pool, id));
  } catch (err) {
    handle(res, err);
  }
});

export default router;