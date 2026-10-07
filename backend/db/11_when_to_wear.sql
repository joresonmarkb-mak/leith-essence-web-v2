ALTER TABLE perfumes ADD COLUMN IF NOT EXISTS when_to_wear TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE perfumes DROP CONSTRAINT IF EXISTS perfumes_when_to_wear_check;
ALTER TABLE perfumes
  ADD CONSTRAINT perfumes_when_to_wear_check
  CHECK (when_to_wear <@ ARRAY['cool', 'summer', 'day', 'night']);