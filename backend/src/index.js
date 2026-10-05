import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import noteRoutes from "./routes/notes.js";
import perfumeRoutes from "./routes/perfumes.js";
import batchRoutes from "./routes/batches.js";
import ownerRoutes from "./routes/owner.js";
import orderRoutes from "./routes/orders.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW() AS time");
  res.json({ status: "ok", dbTime: result.rows[0].time });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/perfumes", perfumeRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/orders", orderRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);