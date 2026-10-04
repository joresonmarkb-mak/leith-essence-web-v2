-- ===== Remove the tag system from file 05 =====
DROP TABLE IF EXISTS quiz_option_traits;
DROP TABLE IF EXISTS perfume_traits;
DROP TABLE IF EXISTS traits;

-- Clear any quiz data from file 07 (cascades to its options)
DELETE FROM quiz_questions;

-- ===== Fields that aren't notes =====
ALTER TABLE perfumes
  ADD COLUMN intensity VARCHAR(10)
  CHECK (intensity IN ('subtle', 'moderate', 'strong'));

ALTER TABLE quiz_options ADD COLUMN intensity VARCHAR(10)
  CHECK (intensity IN ('subtle', 'moderate', 'strong'));
ALTER TABLE quiz_options DROP COLUMN note_id;

-- ===== Which notes each answer points to =====
CREATE TABLE quiz_option_notes (
  option_id INT NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
  note_id   INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  points    INT NOT NULL DEFAULT 1 CHECK (points > 0),
  PRIMARY KEY (option_id, note_id)
);

-- ===== The 22 notes =====
INSERT INTO notes (name) VALUES
('Musk'),('Amber'),('Spices'),('Tonka'),('Smoky / Incense'),('Patchouli'),
('Vanilla'),('Green'),('Marine / Aquatic'),('Citrus'),('Orchard Fruit (Apple/Pear)'),
('Stone Fruit'),('Berries'),('Tropical Fruit'),('Cedar Wood'),('Sandalwood'),
('Oud Wood'),('Vetiver'),('White Florals'),('Aromatic (Lavender & Herbs)'),
('Classic Florals'),('Watery Florals')
ON CONFLICT (name) DO NOTHING;

-- ===== Questions =====
INSERT INTO quiz_questions (question_text, position, max_choices) VALUES
('What type of fragrance are you looking for?', 1, 1),
('How would your friends describe you?', 2, 1),
('What''s your ideal weekend?', 3, 1),
('Where will you wear it most?', 4, 1),
('Which smell makes you happiest?', 5, 1),
('Pick your top 3 notes', 6, 3),
('How noticeable should your scent be?', 7, 1),
('When will you wear it most?', 8, 1),
('How''s your usual weather?', 9, 1);

-- ===== Options (Q1 sets the category, Q7 sets the intensity) =====
INSERT INTO quiz_options (question_id, option_text, position, category, intensity)
SELECT q.id, v.option_text, v.pos, v.category, v.intensity
FROM (VALUES
 (1,1,'Feminine','for_her',NULL),
 (1,2,'Masculine','for_him',NULL),
 (2,1,'Energetic and outgoing',NULL,NULL),
 (2,2,'Soft and romantic',NULL,NULL),
 (2,3,'Calm and confident',NULL,NULL),
 (2,4,'Warm and sweet',NULL,NULL),
 (2,5,'Mysterious and bold',NULL,NULL),
 (3,1,'Beach or outdoors',NULL,NULL),
 (3,2,'Cafe and a good book',NULL,NULL),
 (3,3,'Night out with friends',NULL,NULL),
 (3,4,'Staying in, comfy and cozy',NULL,NULL),
 (3,5,'Garden or picnic date',NULL,NULL),
 (4,1,'School or work',NULL,NULL),
 (4,2,'Daily errands',NULL,NULL),
 (4,3,'Dates',NULL,NULL),
 (4,4,'Parties and nights out',NULL,NULL),
 (4,5,'Special events',NULL,NULL),
 (5,1,'Fresh and clean',NULL,NULL),
 (5,2,'Flowers in bloom',NULL,NULL),
 (5,3,'Sweet and fruity',NULL,NULL),
 (5,4,'Warm woods',NULL,NULL),
 (5,5,'Spices and incense',NULL,NULL),
 (7,1,'Moderate',NULL,'moderate'),
 (7,2,'Strong',NULL,'strong'),
 (7,3,'Subtle, only people close to me notice',NULL,'subtle'),
 (8,1,'Morning',NULL,NULL),
 (8,2,'Afternoon',NULL,NULL),
 (8,3,'Evening and night',NULL,NULL),
 (8,4,'All day',NULL,NULL),
 (9,1,'Hot and humid',NULL,NULL),
 (9,2,'Cool or rainy',NULL,NULL)
) AS v(qpos, pos, option_text, category, intensity)
JOIN quiz_questions q ON q.position = v.qpos;

-- Q6: one option per note, worth 3 points each
INSERT INTO quiz_options (question_id, option_text, position)
SELECT q.id, n.name, ROW_NUMBER() OVER (ORDER BY n.id)
FROM notes n JOIN quiz_questions q ON q.position = 6;

INSERT INTO quiz_option_notes (option_id, note_id, points)
SELECT o.id, n.id, 3
FROM quiz_options o
JOIN quiz_questions q ON q.id = o.question_id AND q.position = 6
JOIN notes n ON n.name = o.option_text;

-- ===== Answer -> notes (1 point per match). Edit these lists to tune the quiz =====
INSERT INTO quiz_option_notes (option_id, note_id)
SELECT o.id, n.id
FROM (VALUES
 (2,'Energetic and outgoing', ARRAY['Citrus','Tropical Fruit','Green','Marine / Aquatic','Aromatic (Lavender & Herbs)']),
 (2,'Soft and romantic',      ARRAY['White Florals','Classic Florals','Musk','Berries','Stone Fruit']),
 (2,'Calm and confident',     ARRAY['Sandalwood','Cedar Wood','Vetiver','Musk','Aromatic (Lavender & Herbs)']),
 (2,'Warm and sweet',         ARRAY['Vanilla','Tonka','Amber','Berries','Stone Fruit']),
 (2,'Mysterious and bold',    ARRAY['Oud Wood','Smoky / Incense','Patchouli','Spices','Amber']),

 (3,'Beach or outdoors',          ARRAY['Citrus','Marine / Aquatic','Tropical Fruit','Watery Florals','Green']),
 (3,'Cafe and a good book',       ARRAY['Cedar Wood','Sandalwood','Vanilla','Tonka','Spices']),
 (3,'Night out with friends',     ARRAY['Spices','Amber','Oud Wood','Patchouli','Smoky / Incense']),
 (3,'Staying in, comfy and cozy', ARRAY['Vanilla','Tonka','Amber','Musk','Sandalwood']),
 (3,'Garden or picnic date',      ARRAY['Classic Florals','White Florals','Orchard Fruit (Apple/Pear)','Green','Berries']),

 (4,'School or work',          ARRAY['Citrus','Green','Musk','Aromatic (Lavender & Herbs)','Vetiver']),
 (4,'Daily errands',           ARRAY['Citrus','Marine / Aquatic','Green','Musk','Orchard Fruit (Apple/Pear)']),
 (4,'Dates',                   ARRAY['Vanilla','Musk','White Florals','Amber','Berries']),
 (4,'Parties and nights out',  ARRAY['Spices','Amber','Tonka','Oud Wood','Stone Fruit']),
 (4,'Special events',          ARRAY['Oud Wood','Amber','White Florals','Sandalwood','Smoky / Incense']),

 (5,'Fresh and clean',     ARRAY['Citrus','Marine / Aquatic','Green','Musk','Watery Florals']),
 (5,'Flowers in bloom',    ARRAY['White Florals','Classic Florals','Watery Florals']),
 (5,'Sweet and fruity',    ARRAY['Vanilla','Tonka','Berries','Stone Fruit','Tropical Fruit','Orchard Fruit (Apple/Pear)']),
 (5,'Warm woods',          ARRAY['Cedar Wood','Sandalwood','Oud Wood','Vetiver']),
 (5,'Spices and incense',  ARRAY['Spices','Smoky / Incense','Patchouli','Amber']),

 (8,'Morning',            ARRAY['Citrus','Green','Aromatic (Lavender & Herbs)','White Florals','Marine / Aquatic']),
 (8,'Afternoon',          ARRAY['Orchard Fruit (Apple/Pear)','Stone Fruit','Tropical Fruit','Classic Florals','Berries']),
 (8,'Evening and night',  ARRAY['Amber','Vanilla','Oud Wood','Spices','Smoky / Incense','Patchouli']),
 (8,'All day',            ARRAY['Musk','Sandalwood','Cedar Wood','Vetiver','Tonka']),

 (9,'Hot and humid',  ARRAY['Citrus','Marine / Aquatic','Watery Florals','Green','Tropical Fruit']),
 (9,'Cool or rainy',  ARRAY['Amber','Vanilla','Oud Wood','Cedar Wood','Spices','Smoky / Incense','Tonka'])
) AS m(qpos, option_text, note_names)
JOIN quiz_questions q ON q.position = m.qpos
JOIN quiz_options  o ON o.question_id = q.id AND o.option_text = m.option_text
CROSS JOIN LATERAL unnest(m.note_names) AS nn(name)
JOIN notes n ON n.name = nn.name;