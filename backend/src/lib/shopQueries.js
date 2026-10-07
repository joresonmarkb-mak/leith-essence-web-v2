// Sellable sizes per perfume: price from the oldest batch with stock,
// and pieces still available (stock minus pieces promised to pending orders)
export const SIZES_CTE = `
  WITH lots AS (
    SELECT bi.id AS batch_item_id, bi.perfume_id, bi.size_ml,
           bi.selling_price::float8 AS price, b.batch_date,
           SUM(os.remaining)::int AS remaining
    FROM batch_items bi
    JOIN batches b ON b.id = bi.batch_id AND b.status <> 'closed'
    JOIN owner_stock os ON os.batch_item_id = bi.id
    WHERE bi.is_active
    GROUP BY bi.id, b.batch_date
    HAVING SUM(os.remaining) > 0
  ),
  reserved AS (
    SELECT oi.perfume_id, oi.size_ml, SUM(oi.quantity)::int AS reserved
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'pending' AND oi.batch_item_id IS NULL
    GROUP BY oi.perfume_id, oi.size_ml
  ),
  sizes AS (
    SELECT l.perfume_id, l.size_ml,
           (ARRAY_AGG(l.price ORDER BY l.batch_date, l.batch_item_id))[1] AS price,
           GREATEST(SUM(l.remaining)::int - COALESCE(MAX(r.reserved), 0), 0) AS available
    FROM lots l
    LEFT JOIN reserved r ON r.perfume_id = l.perfume_id AND r.size_ml = l.size_ml
    GROUP BY l.perfume_id, l.size_ml
  )`;