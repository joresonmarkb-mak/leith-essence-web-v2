import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                        // plenty for one small server
  idleTimeoutMillis: 30_000,      // drop idle connections before Neon does
  connectionTimeoutMillis: 15_000,// allow time for Neon to wake up after a pause
  keepAlive: true,
});

// Neon closes idle connections; without this handler Node would crash on that event
pool.on("error", (err) => console.error("Idle database connection error:", err.message));