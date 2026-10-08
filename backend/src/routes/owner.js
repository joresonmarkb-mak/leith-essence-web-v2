import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.user_id AS "userId", u.email AS "userEmail"
       FROM owners o LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

// Link an owner to a login: { "userId": 4 }. Send { "userId": null } to unlink.
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { userId } = req.body ?? {};
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid owner id." });
  if (userId !== null && !(Number.isInteger(userId) && userId > 0))
    return res.status(400).json({ error: "userId must be a number or null." });
  try {
    const { rows } = await pool.query(
      `UPDATE owners SET user_id = $1 WHERE id = $2 RETURNING id, name, user_id AS "userId"`,
      [userId, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Owner not found." });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23503") return res.status(404).json({ error: "That user doesn't exist." });
    if (err.code === "23505") return res.status(409).json({ error: "That user is already linked to another owner." });
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

export default router;