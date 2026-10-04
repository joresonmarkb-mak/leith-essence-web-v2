-- ===== Users: first/last name split, deactivate =====
-- (works because users is still empty)
ALTER TABLE users DROP COLUMN name;
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100) NOT NULL,
  ADD COLUMN last_name  VARCHAR(100) NOT NULL,
  ADD COLUMN is_active  BOOLEAN NOT NULL DEFAULT TRUE;

-- ===== Perfumes: category and inspired-by =====
ALTER TABLE perfumes ADD COLUMN inspired_by VARCHAR(150);
ALTER TABLE perfumes
  ADD CONSTRAINT perfumes_category_check
  CHECK (category IN ('for_him', 'for_her', 'unisex'));

-- Activate / Deactivate on the Perfumes page
ALTER TABLE batch_items ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ===== Vouchers: title and description =====
ALTER TABLE vouchers
  ADD COLUMN title       VARCHAR(100) NOT NULL,
  ADD COLUMN description TEXT;

-- ===== Orders: GCash proof, paid date, tracking =====
ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;
ALTER TABLE orders
  ADD COLUMN payment_reference VARCHAR(50),
  ADD COLUMN paid_at           TIMESTAMPTZ,
  ADD COLUMN tracking_number   VARCHAR(100);

-- Website orders can only be paid by GCash
ALTER TABLE orders
  ADD CONSTRAINT website_orders_gcash_only
  CHECK (platform <> 'website' OR payment_method = 'gcash');

-- ===== Cashflow =====
CREATE TABLE cashflow_transactions (
  id               SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type             VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
  category         VARCHAR(30) NOT NULL
                   CHECK (category IN ('supply_purchased', 'sale', 'owner_contribution',
                                       'owner_draw', 'shipping', 'marketing', 'other')),
  description      VARCHAR(200) NOT NULL,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url      TEXT,
  -- the owner this money moved through (paid or received it)
  owner_id         INT REFERENCES owners(id),
  batch_id         INT REFERENCES batches(id) ON DELETE SET NULL,
  order_id         INT REFERENCES orders(id) ON DELETE SET NULL,
  batch_expense_id INT UNIQUE REFERENCES batch_expenses(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- contributions and draws must say which owner
  CHECK (category NOT IN ('owner_contribution', 'owner_draw') OR owner_id IS NOT NULL)
);