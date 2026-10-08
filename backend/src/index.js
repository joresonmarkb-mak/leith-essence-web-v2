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
import shopRoutes from "./routes/shop.js";
import cartRoutes from "./routes/cart.js";
import voucherRoutes from "./routes/vouchers.js";
import userRoutes from "./routes/users.js";
import cashflowRoutes from "./routes/cashflow.js";
import ledgerRoutes from "./routes/ledger.js";
import dashboardRoutes from "./routes/dashboard.js";
import quizRoutes from "./routes/quiz.js";
import uploadRoutes from "./routes/uploads.js";

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
app.use("/api/shop", shopRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cashflow", cashflowRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/uploads", uploadRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);