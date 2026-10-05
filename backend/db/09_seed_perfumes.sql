INSERT INTO perfumes (name, inspired_by, category, intensity) VALUES
('After Hour',    'Stronger With You Intense', 'for_him', 'strong'),
('Phantom',       NULL,                        'for_him', 'moderate'),
('Midnight Muse', 'Good Girl',                 'for_her', 'strong');

INSERT INTO perfume_notes (perfume_id, note_id, position)
SELECT p.id, n.id, v.pos
FROM (VALUES
 ('After Hour',    'Vanilla',                      1),
 ('After Hour',    'Tonka',                        2),
 ('After Hour',    'Amber',                        3),
 ('Phantom',       'Spices',                       1),
 ('Phantom',       'Vanilla',                      2),
 ('Phantom',       'Aromatic (Lavender & Herbs)',  3),
 ('Midnight Muse', 'Tonka',                        1),
 ('Midnight Muse', 'White Florals',                2),
 ('Midnight Muse', 'Vanilla',                      3)
) AS v(perfume, note, pos)
JOIN perfumes p ON p.name = v.perfume
JOIN notes n ON n.name = v.note;