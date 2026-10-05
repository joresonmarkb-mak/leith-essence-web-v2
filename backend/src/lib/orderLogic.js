export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// One order change at a time, so two buyers can't take the last bottle together
const LOCK_KEY = 7001;
export const lockOrders = (client) =>
  client.query("SELECT pg_advisory_xact_lock($1)", [LOCK_KEY]);

function defaultShippingFee() {
  const fee = Number(process.env.SHIPPING_FEE ?? 75);
  return Number.isFinite(fee) && fee >= 0 ? fee : 75;
}

function normalizeItems(items, allowPrice) {
  if (!Array.isArray(items) || items.length === 0)
    throw new HttpError(400, "Add at least one perfume.");
  const merged = new Map();
  for (const it of items) {
    const perfumeId = Number(it?.perfumeId);
    const sizeMl = Number(it?.sizeMl);
    const quantity = Number(it?.quantity);
    if (![perfumeId, sizeMl, quantity].every((n) => Number.isInteger(n) && n > 0))
      throw new HttpError(400, "Each item needs a perfume, a size, and a quantity of at least 1.");
    let unitPrice;
    if (allowPrice && it.unitPrice != null) {
      if (typeof it.unitPrice !== "number" || !Number.isFinite(it.unitPrice) || it.unitPrice < 0)
        throw new HttpError(400, "Unit price must be 0 or more.");
      unitPrice = it.unitPrice;
    }
    const key = `${perfumeId}:${sizeMl}`;
    if (merged.has(key)) merged.get(key).quantity += quantity;
    else merged.set(key, { perfumeId, sizeMl, quantity, unitPrice });
  }
  return [...merged.values()];
}

// Stock lots for a perfume and size, oldest batch first
const LOTS_SQL = `
  SELECT os.batch_item_id AS "batchItemId", os.owner_id AS "ownerId",
         os.remaining::int AS remaining, bi.selling_price::float8 AS price
  FROM owner_stock os
  JOIN batch_items bi ON bi.id = os.batch_item_id AND bi.is_active
  JOIN batches b ON b.id = bi.batch_id AND b.status <> 'closed'
  WHERE bi.perfume_id = $1 AND bi.size_ml = $2 AND os.remaining > 0
    AND ($3::int IS NULL OR os.owner_id = $3)
  ORDER BY b.batch_date, bi.id, os.remaining DESC, os.owner_id`;

// Pieces promised to pending website orders that aren't assigned to a batch yet
const RESERVED_SQL = `
  SELECT COALESCE(SUM(oi.quantity), 0)::int AS reserved
  FROM order_items oi JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'pending' AND oi.batch_item_id IS NULL
    AND oi.perfume_id = $1 AND oi.size_ml = $2`;

const getLots = async (db, perfumeId, sizeMl, ownerId = null) =>
  (await db.query(LOTS_SQL, [perfumeId, sizeMl, ownerId])).rows;

// Works out prices, voucher discount, shipping and total. Never trusts a price from the client.
export async function priceOrder(db, {
  items, voucherCode, type = "shipping", shippingFee,
  checkAvailability = false, allowPrice = false, lockVoucher = false,
}) {
  const wanted = normalizeItems(items, allowPrice);
  const lines = [];

  for (const it of wanted) {
    const { rows: found } = await db.query("SELECT name FROM perfumes WHERE id = $1", [it.perfumeId]);
    if (!found[0]) throw new HttpError(400, "One of the perfumes doesn't exist.");
    const label = `${found[0].name} ${it.sizeMl}ml`;

    const lots = await getLots(db, it.perfumeId, it.sizeMl);
    if (!lots.length) throw new HttpError(409, `${label} is out of stock.`);

    if (checkAvailability) {
      const inStock = lots.reduce((s, l) => s + l.remaining, 0);
      const { rows } = await db.query(RESERVED_SQL, [it.perfumeId, it.sizeMl]);
      const available = inStock - rows[0].reserved;
      if (available < it.quantity)
        throw new HttpError(409, available > 0 ? `Only ${available} of ${label} left.` : `${label} is out of stock.`);
    }

    const unitPrice = it.unitPrice ?? lots[0].price;
    lines.push({ ...it, name: found[0].name, unitPrice: r2(unitPrice) });
  }

  const subtotal = r2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));

  let discount = 0;
  let voucher = null;
  if (typeof voucherCode === "string" && voucherCode.trim()) {
    const { rows } = await db.query(
      `SELECT * FROM vouchers WHERE UPPER(code) = UPPER($1) ${lockVoucher ? "FOR UPDATE" : ""}`,
      [voucherCode.trim()]
    );
    const v = rows[0];
    const now = new Date();
    if (!v || !v.is_active) throw new HttpError(400, "That promo code isn't valid.");
    if (v.starts_at && v.starts_at > now) throw new HttpError(400, "That promo code isn't active yet.");
    if (v.expires_at && v.expires_at < now) throw new HttpError(400, "That promo code has expired.");
    if (v.max_uses != null && v.used_count >= v.max_uses)
      throw new HttpError(400, "That promo code has been fully used.");
    if (subtotal < Number(v.min_spend))
      throw new HttpError(400, `Spend at least ₱${Number(v.min_spend).toFixed(2)} to use this code.`);
    const value = Number(v.discount_value);
    discount = r2(Math.min(subtotal, v.discount_type === "percent" ? (subtotal * value) / 100 : value));
    voucher = { id: v.id, code: v.code, title: v.title };
  }

  const shipping = type === "pickup" ? 0 : r2(shippingFee ?? defaultShippingFee());
  return { lines, subtotal, shipping, discount, total: r2(subtotal + shipping - discount), voucher };
}

// Saves a pending order with its items. Stock is assigned later, when payment is confirmed.
export async function createOrder(client, { pricing, order }) {
  const priced = await priceOrder(client, { ...pricing, type: order.type, lockVoucher: true });
  const { rows } = await client.query(
    `INSERT INTO orders
       (user_id, buyer_name, buyer_phone, buyer_email, province, city, barangay, street,
        type, status, platform, payment_method, payment_reference, receipt_url, voucher_id,
        subtotal, shipping_fee, discount, total, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING id`,
    [
      order.userId ?? null, order.buyerName, order.buyerPhone ?? null, order.buyerEmail ?? null,
      order.province ?? null, order.city ?? null, order.barangay ?? null, order.street ?? null,
      order.type, order.platform, order.paymentMethod, order.paymentReference ?? null,
      order.receiptUrl ?? null, priced.voucher?.id ?? null,
      priced.subtotal, priced.shipping, priced.discount, priced.total, order.notes ?? null,
    ]
  );
  const orderId = rows[0].id;
  await client.query(
    `INSERT INTO order_items (order_id, perfume_id, size_ml, quantity, unit_price)
     SELECT $1, t.pid, t.sz, t.qty, t.price
     FROM unnest($2::int[], $3::int[], $4::int[], $5::numeric[]) AS t(pid, sz, qty, price)`,
    [
      orderId,
      priced.lines.map((l) => l.perfumeId), priced.lines.map((l) => l.sizeMl),
      priced.lines.map((l) => l.quantity), priced.lines.map((l) => l.unitPrice),
    ]
  );
  if (priced.voucher)
    await client.query("UPDATE vouchers SET used_count = used_count + 1 WHERE id = $1", [priced.voucher.id]);
  return { orderId, priced };
}

// Takes each item from the oldest stock (optionally one owner's only), splitting rows if needed
async function allocateOrder(client, orderId, ownerId) {
  const { rows: items } = await client.query(
    `SELECT oi.id, oi.perfume_id, oi.size_ml, oi.quantity, oi.unit_price, p.name
     FROM order_items oi JOIN perfumes p ON p.id = oi.perfume_id
     WHERE oi.order_id = $1 AND oi.batch_item_id IS NULL ORDER BY oi.id`,
    [orderId]
  );
  for (const item of items) {
    const lots = await getLots(client, item.perfume_id, item.size_ml, ownerId);
    let need = item.quantity;
    const chunks = [];
    for (const lot of lots) {
      if (need === 0) break;
      const take = Math.min(lot.remaining, need);
      chunks.push({ ...lot, take });
      need -= take;
    }
    if (need > 0) {
      const have = item.quantity - need;
      throw new HttpError(409,
        `${ownerId ? "That owner has" : "There is"} only ${have} of ${item.name} ${item.size_ml}ml in stock, but the order needs ${item.quantity}.`);
    }
    const [first, ...rest] = chunks;
    await client.query(
      "UPDATE order_items SET batch_item_id = $1, owner_id = $2, quantity = $3 WHERE id = $4",
      [first.batchItemId, first.ownerId, first.take, item.id]
    );
    for (const c of rest) {
      await client.query(
        `INSERT INTO order_items (order_id, perfume_id, size_ml, quantity, unit_price, batch_item_id, owner_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orderId, item.perfume_id, item.size_ml, c.take, item.unit_price, c.batchItemId, c.ownerId]
      );
    }
  }
}

// Payment confirmed: assign stock, mark paid, record the sale in cashflow
export async function confirmPayment(client, orderId, { ownerId = null, receivedByOwnerId = null } = {}) {
  await allocateOrder(client, orderId, ownerId);
  await client.query("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1", [orderId]);
  await client.query(
    `INSERT INTO cashflow_transactions
       (transaction_date, type, category, description, amount, receipt_url, owner_id, order_id)
     SELECT (NOW() AT TIME ZONE 'Asia/Manila')::date, 'in', 'sale',
            'Order #' || o.id || ' - ' || o.buyer_name, o.total, o.receipt_url, $2::int, o.id
     FROM orders o WHERE o.id = $1 AND o.total > 0`,
    [orderId, receivedByOwnerId]
  );
}