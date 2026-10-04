import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
};

// Public: the 22 notes (the shop and the quiz both use this)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, image_url AS "imageUrl" FROM notes ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

// Admin: add a new note
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, imageUrl } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Enter the note name." });
  try {
    const { rows } = await pool.query(
      `INSERT INTO notes (name, image_url) VALUES ($1, $2)
       RETURNING id, name, image_url AS "imageUrl"`,
      [name.trim(), imageUrl || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "That note already exists." });
    fail(res, err);
  }
});

// Admin: set a note's photo
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid note id." });
  try {
    const { rows } = await pool.query(
      `UPDATE notes SET image_url = $1 WHERE id = $2
       RETURNING id, name, image_url AS "imageUrl"`,
      [req.body?.imageUrl || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Note not found." });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err);
  }
});

export default router;