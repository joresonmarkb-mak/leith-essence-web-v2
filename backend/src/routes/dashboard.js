import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const PLATFORMS = ["website", "facebook", "instagram", "tiktok", "shopee", "events"];
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const change = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit" })
    .formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}`;
}

// $1 = first day of the month (2026-10-01). One row per paid or fulfilled order in that month.
const SALES = `
sales AS (
  SELECT o.id, o.platform,
         (o.total - o.shipping_fee)::float8 AS revenue,
         (SELECT COALESCE(SUM(oi.quantity * bi.cost_per_piece), 0)
          FROM order_items oi JOIN batch_items bi ON bi.id = oi.batch_item_id
          WHERE oi.order_id = o.id)::float8 AS cost,
         (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id)::int AS units,
         (COALESCE(o.paid_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date AS day
  FROM orders o
  WHERE o.status IN ('paid', 'fulfilled')
    AND (COALESCE(o.paid_at, o.created_at) AT TIME ZONE 'Asia/Manila') >= $1::date
    AND (COALESCE(o.paid_at, o.created_at) AT TIME ZONE 'Asia/Manila') < ($1::date + interval '1 month')
)`;

const STATS_SQL = `
WITH ${SALES}
SELECT COALESCE(SUM(revenue), 0)::float8 AS revenue,
       COALESCE(SUM(cost), 0)::float8 AS cost,
       COALESCE(SUM(units), 0)::int AS units,
       COUNT(*)::int AS orders
FROM sales`;

router.get("/", async (req, res) => {
  const month = req.query.month ?? currentMonth();
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return res.status(400).json({ error: "Month must look like 2026-10." });
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const prevStart = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, "0")}-01`;

  try {
    const [cur, prev, daily, platforms, best, recent, snapshot, users] = await Promise.all([
      pool.query(STATS_SQL, [start]),
      pool.query(STATS_SQL, [prevStart]),

      pool.query(
        `WITH ${SALES},
         days AS (SELECT d::date AS day
                  FROM generate_series($1::timestamp, ($1::date + interval '1 month')::timestamp - interval '1 day',
                                       interval '1 day') d)
         SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(s.revenue), 0)::float8 AS revenue,
                COALESCE(SUM(s.units), 0)::int AS units
         FROM days LEFT JOIN sales s ON s.day = days.day
         GROUP BY days.day ORDER BY days.day`, [start]),

      pool.query(
        `WITH ${SALES}
         SELECT platform, COUNT(*)::int AS orders, SUM(revenue)::float8 AS revenue, SUM(units)::int AS units
         FROM sales GROUP BY platform`, [start]),

      pool.query(
        `WITH ${SALES}
         SELECT p.id, p.name, p.image_url AS "imageUrl",
                SUM(oi.quantity)::int AS units,
                SUM(oi.quantity * oi.unit_price)::float8 AS revenue
         FROM sales s
         JOIN order_items oi ON oi.order_id = s.id
         JOIN perfumes p ON p.id = oi.perfume_id
         GROUP BY p.id, p.name, p.image_url
         ORDER BY units DESC, revenue DESC LIMIT 5`, [start]),

      pool.query(
        `SELECT o.id, o.buyer_name AS "buyerName", o.status, o.platform,
                o.total::float8 AS total, o.created_at AS "createdAt",
                (SELECT string_agg(p.name || ' ' || oi.size_ml || 'ml x ' || oi.quantity, ', ' ORDER BY oi.id)
                 FROM order_items oi JOIN perfumes p ON p.id = oi.perfume_id
                 WHERE oi.order_id = o.id) AS items
         FROM orders o
         WHERE (o.created_at AT TIME ZONE 'Asia/Manila') >= $1::date
           AND (o.created_at AT TIME ZONE 'Asia/Manila') < ($1::date + interval '1 month')
         ORDER BY o.created_at DESC, o.id DESC LIMIT 5`, [start]),

      pool.query(
        `SELECT COALESCE(SUM(os.remaining * bi.cost_per_piece), 0)::float8 AS "stockValue",
                COALESCE(SUM(os.remaining), 0)::int AS "totalStocks",
                (SELECT COUNT(*) FROM orders WHERE status = 'pending')::int AS "pendingOrders"
         FROM owner_stock os JOIN batch_items bi ON bi.id = os.batch_item_id`),

      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila') >= $1::date
                                   AND (created_at AT TIME ZONE 'Asia/Manila') < ($1::date + interval '1 month'))::int
                  AS "newThisMonth"
         FROM users WHERE role = 'customer' AND is_active`, [start]),
    ]);

    const c = cur.rows[0];
    const p = prev.rows[0];
    const profit = c.revenue - c.cost;
    const prevProfit = p.revenue - p.cost;
    const byPlatform = new Map(platforms.rows.map((r) => [r.platform, r]));
    const platformRevenue = platforms.rows.reduce((s, r) => s + r.revenue, 0);

    res.json({
      month,
      cards: {
        revenue: { value: r2(c.revenue), change: change(c.revenue, p.revenue) },
        profit: { value: r2(profit), change: change(profit, prevProfit) },
        perfumesSold: { value: c.units, change: change(c.units, p.units) },
        orders: { value: c.orders, change: change(c.orders, p.orders) },
        stockValue: r2(snapshot.rows[0].stockValue),
        totalStocks: snapshot.rows[0].totalStocks,
        pendingOrders: snapshot.rows[0].pendingOrders,
        users: users.rows[0],
      },
      salesByDay: daily.rows.map((d) => ({ ...d, revenue: r2(d.revenue) })),
      salesByPlatform: PLATFORMS.map((name) => {
        const row = byPlatform.get(name);
        return {
          platform: name,
          orders: row?.orders ?? 0,
          units: row?.units ?? 0,
          revenue: r2(row?.revenue ?? 0),
          share: platformRevenue > 0 ? Math.round(((row?.revenue ?? 0) / platformRevenue) * 1000) / 10 : 0,
        };
      }),
      bestSelling: best.rows,
      recentOrders: recent.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

export default router;