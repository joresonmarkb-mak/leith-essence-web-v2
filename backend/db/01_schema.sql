CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone         VARCHAR(30),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A perfume "profile": reused across batches
CREATE TABLE perfumes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  scent_notes TEXT,
  category    VARCHAR(50),
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batches (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials and other expenses for one batch
CREATE TABLE batch_expenses (
  id          SERIAL PRIMARY KEY,
  batch_id    INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('material', 'other')),
  description VARCHAR(200) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0)
);

-- Perfumes produced in a batch (profile + quantity + cost + price)
CREATE TABLE batch_items (
  id                SERIAL PRIMARY KEY,
  batch_id          INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  perfume_id        INT NOT NULL REFERENCES perfumes(id),
  quantity_produced INT NOT NULL CHECK (quantity_produced > 0),
  cost_per_piece    NUMERIC(12,2) NOT NULL CHECK (cost_per_piece >= 0),
  selling_price     NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
  UNIQUE (batch_id, perfume_id)
);