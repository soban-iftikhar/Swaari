import dotenv from "dotenv";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./configs/db.js";
import validateEnv from "./utils/validateEnv.js";
import initSocket from "./socket/index.js";
import errorHandler from "./middlewares/errorHandler.js";

import riderRoutes from "./routes/riderRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

/**
 * Application entrypoint.
 *
 * Boot order:
 *   1. Load & validate environment (fail fast on missing secrets).
 *   2. Connect to MongoDB.
 *   3. Build the Express app (REST) and an HTTP server.
 *   4. Attach Socket.io (real-time) to the same HTTP server.
 *   5. Register the central error handler last.
 */
(async () => {
  dotenv.config();
  validateEnv();

  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 5000;
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  // ── Core middleware ──────────────────────────────────────
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Health check ─────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "swaari-backend", time: new Date().toISOString() });
  });

  // ── REST routes ──────────────────────────────────────────
  app.use("/api/riders", riderRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/rides", rideRoutes);

  // ── 404 for unknown API routes ───────────────────────────
  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // ── Central error handler (must be last) ─────────────────
  app.use(errorHandler);

  // ── HTTP + Socket.io ─────────────────────────────────────
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server (REST + Socket.io) running on port ${PORT}`);
  });

  // Fail loudly on unexpected async faults.
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
})();
