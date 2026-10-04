-- ===== Traits =====
INSERT INTO traits (type, code, label) VALUES
('vibe','energetic_outgoing','Energetic and outgoing'),
('vibe','soft_romantic','Soft and romantic'),
('vibe','calm_confident','Calm and confident'),
('vibe','warm_sweet','Warm and sweet'),
('vibe','mysterious_bold','Mysterious and bold'),
('scent_family','fresh','Fresh'),
('scent_family','floral','Floral'),
('scent_family','fruity','Fruity'),
('scent_family','sweet','Sweet'),
('scent_family','woody','Woody'),
('scent_family','spicy','Spicy'),
('occasion','school_work','School or work'),
('occasion','daily_errands','Daily errands'),
('occasion','dates','Dates'),
('occasion','parties','Parties and nights out'),
('occasion','special_events','Special events'),
('intensity','subtle','Subtle'),
('intensity','moderate','Moderate'),
('intensity','strong','Strong'),
('time_of_day','morning','Morning'),
('time_of_day','afternoon','Afternoon'),
('time_of_day','evening_night','Evening and night'),
('time_of_day','all_day','All day'),
('weather','hot_humid','Hot and humid'),
('weather','cool_rainy','Cool or rainy');

-- ===== The 22 notes (add photos later) =====
INSERT INTO notes (name) VALUES
('Musk'),('Amber'),('Spices'),('Tonka'),('Smoky / Incense'),('Patchouli'),
('Vanilla'),('Green'),('Marine / Aquatic'),('Citrus'),('Orchard Fruit (Apple/Pear)'),
('Stone Fruit'),('Berries'),('Tropical Fruit'),('Cedar Wood'),('Sandalwood'),
('Oud Wood'),('Vetiver'),('White Florals'),('Aromatic (Lavender & Herbs)'),
('Classic Florals'),('Watery Florals');

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

-- ===== Options for every question except Q6 =====
INSERT INTO quiz_options (question_id, option_text, position, category)
SELECT q.id, v.option_text, v.pos, v.category
FROM (VALUES
 (1,1,'Feminine','for_her'),
 (1,2,'Masculine','for_him'),
 (2,1,'Energetic and outgoing',NULL),
 (2,2,'Soft and romantic',NULL),
 (2,3,'Calm and confident',NULL),
 (2,4,'Warm and sweet',NULL),
 (2,5,'Mysterious and bold',NULL),
 (3,1,'Beach or outdoors',NULL),
 (3,2,'Cafe and a good book',NULL),
 (3,3,'Night out with friends',NULL),
 (3,4,'Staying in, comfy and cozy',NULL),
 (3,5,'Garden or picnic date',NULL),
 (4,1,'School or work',NULL),
 (4,2,'Daily errands',NULL),
 (4,3,'Dates',NULL),
 (4,4,'Parties and nights out',NULL),
 (4,5,'Special events',NULL),
 (5,1,'Fresh and clean',NULL),
 (5,2,'Flowers in bloom',NULL),
 (5,3,'Sweet and fruity',NULL),
 (5,4,'Warm woods',NULL),
 (5,5,'Spices and incense',NULL),
 (7,1,'Moderate',NULL),
 (7,2,'Strong',NULL),
 (7,3,'Subtle, only people close to me notice',NULL),
 (8,1,'Morning',NULL),
 (8,2,'Afternoon',NULL),
 (8,3,'Evening and night',NULL),
 (8,4,'All day',NULL),
 (9,1,'Hot and humid',NULL),
 (9,2,'Cool or rainy',NULL)
) AS v(qpos, pos, option_text, category)
JOIN quiz_questions q ON q.position = v.qpos;

-- ===== Q6: one option per note =====
INSERT INTO quiz_options (question_id, option_text, position, note_id)
SELECT q.id, n.name, ROW_NUMBER() OVER (ORDER BY n.id), n.id
FROM notes n
JOIN quiz_questions q ON q.position = 6;

-- ===== Points: which perfume traits each answer rewards =====
INSERT INTO quiz_option_traits (option_id, trait_id, points)
SELECT o.id, t.id, m.points
FROM (VALUES
 -- Q2 vibe (3 points)
 (2,'Energetic and outgoing','vibe','energetic_outgoing',3),
 (2,'Soft and romantic','vibe','soft_romantic',3),
 (2,'Calm and confident','vibe','calm_confident',3),
 (2,'Warm and sweet','vibe','warm_sweet',3),
 (2,'Mysterious and bold','vibe','mysterious_bold',3),
 -- Q3 weekend -> scent family (2 main, 1 secondary)
 (3,'Beach or outdoors','scent_family','fresh',2),
 (3,'Beach or outdoors','scent_family','fruity',1),
 (3,'Cafe and a good book','scent_family','woody',2),
 (3,'Cafe and a good book','scent_family','sweet',1),
 (3,'Night out with friends','scent_family','spicy',2),
 (3,'Night out with friends','scent_family','sweet',1),
 (3,'Staying in, comfy and cozy','scent_family','sweet',2),
 (3,'Staying in, comfy and cozy','scent_family','woody',1),
 (3,'Garden or picnic date','scent_family','floral',2),
 (3,'Garden or picnic date','scent_family','fruity',1),
 -- Q4 occasion (2 points)
 (4,'School or work','occasion','school_work',2),
 (4,'Daily errands','occasion','daily_errands',2),
 (4,'Dates','occasion','dates',2),
 (4,'Parties and nights out','occasion','parties',2),
 (4,'Special events','occasion','special_events',2),
 -- Q5 happiest smell -> scent family (2 points total)
 (5,'Fresh and clean','scent_family','fresh',2),
 (5,'Flowers in bloom','scent_family','floral',2),
 (5,'Sweet and fruity','scent_family','sweet',1),
 (5,'Sweet and fruity','scent_family','fruity',1),
 (5,'Warm woods','scent_family','woody',2),
 (5,'Spices and incense','scent_family','spicy',2),
 -- Q7 intensity (2 points)
 (7,'Moderate','intensity','moderate',2),
 (7,'Strong','intensity','strong',2),
 (7,'Subtle, only people close to me notice','intensity','subtle',2),
 -- Q8 time of day (1 point)
 (8,'Morning','time_of_day','morning',1),
 (8,'Afternoon','time_of_day','afternoon',1),
 (8,'Evening and night','time_of_day','evening_night',1),
 (8,'All day','time_of_day','all_day',1),
 -- Q9 weather (1 point)
 (9,'Hot and humid','weather','hot_humid',1),
 (9,'Cool or rainy','weather','cool_rainy',1)
) AS m(qpos, option_text, trait_type, trait_code, points)
JOIN quiz_questions q ON q.position = m.qpos
JOIN quiz_options  o ON o.question_id = q.id AND o.option_text = m.option_text
JOIN traits        t ON t.type = m.trait_type AND t.code = m.trait_code;