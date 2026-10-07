import { Router } from "express";
import { pool } from "../db.js";
import { SIZES_CTE } from "../lib/shopQueries.js";

const router = Router();

const CATEGORIES = ["for_him", "for_her", "unisex"];
const SORTS = {
  name: "p.name",
  newest: "p.id DESC",
  price_asc: `"fromPrice" ASC, p.name`,
  price_desc: `"fromPrice" DESC, p.name`,
};

const IN_STOCK = `EXISTS (SELECT 1 FROM sizes s WHERE s.perfume_id = p.id AND s.available > 0)`;

const CARD_COLUMNS = `
  p.id, p.name, p.inspired_by AS "inspiredBy", p.category, p.image_url AS "imageUrl",
  (SELECT COALESCE(json_agg(json_build_object('sizeMl', s.size_ml, 'price', s.price,
                                              'available', s.available) ORDER BY s.size_ml), '[]')
   FROM sizes s WHERE s.perfume_id = p.id AND s.available > 0) AS sizes,
  (SELECT MIN(s.price) FROM sizes s WHERE s.perfume_id = p.id AND s.available > 0) AS "fromPrice",
  (SELECT SUM(s.available)::int FROM sizes s WHERE s.perfume_id = p.id AND s.available > 0) AS "piecesLeft"`;

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// All perfumes in stock: ?category=for_him&sort=price_asc&q=prince
router.get("/perfumes", async (req, res) => {
  const { category, sort, q } = req.query;
  const where = [IN_STOCK];
  const params = [];
  if (typeof category === "string" && category) {
    if (!CATEGORIES.includes(category))
      return res.status(400).json({ error: "Category must be for_him, for_her, or unisex." });
    params.push(category);
    where.push(`p.category = $${params.length}`);
  }
  if (typeof q === "string" && q.trim()) {
    params.push(`%${q.trim()}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.inspired_by ILIKE $${params.length})`);
  }
  const order = typeof sort === "string" && Object.hasOwn(SORTS, sort) ? SORTS[sort] : SORTS.name;
  try {
    const { rows } = await pool.query(
      `${SIZES_CTE}
       SELECT ${CARD_COLUMNS} FROM perfumes p
       WHERE ${where.join(" AND ")} ORDER BY ${order}`,
      params
    );
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

// Perfume detail page, plus "you may also like"
router.get("/perfumes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid perfume id." });
  try {
    const { rows } = await pool.query(
      `${SIZES_CTE}
       SELECT ${CARD_COLUMNS}, p.description, p.when_to_wear AS "whenToWear",
         (SELECT COALESCE(json_agg(json_build_object('id', n.id, 'name', n.name, 'imageUrl', n.image_url)
                                   ORDER BY pn.position), '[]')
          FROM perfume_notes pn JOIN notes n ON n.id = pn.note_id
          WHERE pn.perfume_id = p.id) AS notes
       FROM perfumes p WHERE p.id = $1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Perfume not found." });
    const related = await pool.query(
      `${SIZES_CTE}
       SELECT ${CARD_COLUMNS} FROM perfumes p
       WHERE p.id <> $1 AND ${IN_STOCK}
       ORDER BY (p.category = $2) DESC, p.name LIMIT 4`,
      [id, rows[0].category]
    );
    res.json({ ...rows[0], soldOut: rows[0].sizes.length === 0, related: related.rows });
  } catch (err) {
    fail(res, err);
  }
});

export default router;