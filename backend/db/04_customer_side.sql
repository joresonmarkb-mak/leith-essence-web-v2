-- ===== Perfume details: key notes and when to wear =====
ALTER TABLE perfumes DROP COLUMN scent_notes;

ALTER TABLE perfumes
  ADD COLUMN when_to_wear TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE perfumes
  ADD CONSTRAINT perfumes_when_to_wear_check
  CHECK (when_to_wear <@ ARRAY['cool', 'summer', 'day', 'night']);

CREATE TABLE notes (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(80) UNIQUE NOT NULL,
  image_url TEXT
);

CREATE TABLE perfume_notes (
  perfume_id INT NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  note_id    INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  position   INT NOT NULL DEFAULT 1,
  PRIMARY KEY (perfume_id, note_id)
);

-- ===== Cart =====
CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id INT NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  size_ml    INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (user_id, perfume_id, size_ml)
);

-- ===== Orders: checkout fields (works while orders is empty) =====
ALTER TABLE orders DROP COLUMN address;
ALTER TABLE orders
  ADD COLUMN buyer_email VARCHAR(150),
  ADD COLUMN province    VARCHAR(100),
  ADD COLUMN city        VARCHAR(100),
  ADD COLUMN barangay    VARCHAR(100),
  ADD COLUMN street      VARCHAR(200),
  ADD COLUMN subtotal    NUMERIC(12,2) NOT NULL;

ALTER TABLE orders
  ADD CONSTRAINT orders_total_matches
  CHECK (total = subtotal + shipping_fee - discount);

-- Shipping orders need a full address; pickup orders don't
ALTER TABLE orders
  ADD CONSTRAINT orders_shipping_needs_address
  CHECK (type <> 'shipping'
         OR (province IS NOT NULL AND city IS NOT NULL
             AND barangay IS NOT NULL AND street IS NOT NULL));

-- ===== Fragrance quiz =====
CREATE TABLE quiz_questions (
  id            SERIAL PRIMARY KEY,
  question_text VARCHAR(200) NOT NULL,
  position      INT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE quiz_options (
  id          SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text VARCHAR(150) NOT NULL,
  position    INT NOT NULL
);

CREATE TABLE quiz_attempts (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quiz_answers (
  attempt_id  INT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES quiz_questions(id),
  option_id   INT NOT NULL REFERENCES quiz_options(id),
  PRIMARY KEY (attempt_id, question_id)
);