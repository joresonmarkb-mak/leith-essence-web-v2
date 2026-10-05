-- Stock left per owner for each batch item (sold = paid or fulfilled orders only)
CREATE VIEW owner_stock AS
SELECT sa.batch_item_id,
       sa.owner_id,
       sa.quantity - COALESCE(s.sold, 0) AS remaining
FROM stock_allocations sa
LEFT JOIN (
  SELECT oi.batch_item_id, oi.owner_id, SUM(oi.quantity) AS sold
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'fulfilled')
    AND oi.batch_item_id IS NOT NULL AND oi.owner_id IS NOT NULL
  GROUP BY oi.batch_item_id, oi.owner_id
) s ON s.batch_item_id = sa.batch_item_id AND s.owner_id = sa.owner_id;

CREATE INDEX ON order_items (order_id);
CREATE INDEX ON order_items (batch_item_id);
CREATE INDEX ON orders (created_at);
CREATE INDEX ON orders (user_id);