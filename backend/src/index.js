import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import subscribersRouter from "./routes/subscribers.js";
import announcementsRouter from "./routes/announcements.js";
import reviewsRouter from "./routes/reviews.js";
import orderReceivedRouter from "./routes/orderReceived.js";
import {
  apiLimiter, loginLimiter, registerLimiter, emailLimiter, googleLimiter,
  subscribeLimiter, checkoutLimiter, announceLimiter,
} from "./middleware/rateLimits.js";

const app = express();

// Render sits behind a proxy; without this every visitor looks like the same IP
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Only your own site may call the API from a browser.
// CORS_ORIGINS = comma-separated list, e.g. "https://leithessence.ph,https://www.leithessence.ph"
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // no Origin = not a browser (curl, health checks); allow those
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check (before the rate limiter, so Render's pings never count)
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(503).json({ status: "error" });
  }
});

// ---- Rate limits (must come BEFORE the routes they protect) ----
app.use("/api", apiLimiter);

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/auth/resend-verification", emailLimiter);
app.use("/api/auth/google", googleLimiter);

app.post("/api/subscribers", subscribeLimiter);        // newsletter sign-up only
app.post("/api/orders/checkout", checkoutLimiter);
app.post("/api/announcements/send", announceLimiter);

// ---- Routes ----
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
app.use("/api/subscribers", subscribersRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/reviews", reviewsRouter);
// only needed if you did NOT paste the "received" route into routes/orders.js
app.use("/api/orders", orderReceivedRouter);

// Unknown /api paths
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Last-resort error handler (keeps stack traces away from visitors)
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") return res.status(403).json({ error: "Origin not allowed." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);