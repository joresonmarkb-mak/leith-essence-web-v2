-- ===== Changes to the first group =====
ALTER TABLE batches
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'sold_out', 'closed'));

-- A batch item is now perfume + size
ALTER TABLE batch_items ADD COLUMN size_ml INT NOT NULL DEFAULT 50;
ALTER TABLE batch_items DROP CONSTRAINT batch_items_batch_id_perfume_id_key;
ALTER TABLE batch_items ADD UNIQUE (batch_id, perfume_id, size_ml);

-- Rebuild expenses to match the Materials And Cost table (safe only while it's empty)
DROP TABLE batch_expenses;
CREATE TABLE batch_expenses (
  id          SERIAL PRIMARY KEY,
  batch_id    INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL DEFAULT 'material'
              CHECK (type IN ('material', 'other')),
  description VARCHAR(200) NOT NULL,
  quantity    NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_cost  NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Owners and who holds the stock =====
CREATE TABLE owners (
  id      SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name    VARCHAR(100) NOT NULL
);

CREATE TABLE stock_allocations (
  id            SERIAL PRIMARY KEY,
  batch_item_id INT NOT NULL REFERENCES batch_items(id) ON DELETE CASCADE,
  owner_id      INT NOT NULL REFERENCES owners(id),
  quantity      INT NOT NULL CHECK (quantity >= 0),
  UNIQUE (batch_item_id, owner_id)
);

-- ===== Vouchers =====
CREATE TABLE vouchers (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(30) UNIQUE NOT NULL,
  discount_type  VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_spend      NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses       INT,
  used_count     INT NOT NULL DEFAULT 0,
  starts_at      TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Orders =====
CREATE TABLE orders (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id) ON DELETE SET NULL,
  buyer_name     VARCHAR(100) NOT NULL,
  buyer_phone    VARCHAR(30),
  address        TEXT,
  type           VARCHAR(20) NOT NULL DEFAULT 'shipping'
                 CHECK (type IN ('shipping', 'pickup')),
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
  platform       VARCHAR(20) NOT NULL
                 CHECK (platform IN ('website', 'facebook', 'instagram', 'tiktok', 'shopee', 'events')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('gcash', 'qrph', 'cash', 'other')),
  receipt_url    TEXT,
  voucher_id     INT REFERENCES vouchers(id),
  discount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_fee   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total          NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  perfume_id    INT NOT NULL REFERENCES perfumes(id),
  size_ml       INT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  -- filled in when the admin assigns which batch and owner's stock covers it
  batch_item_id INT REFERENCES batch_items(id),
  owner_id      INT REFERENCES owners(id)
);