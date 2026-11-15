import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { datasetsRouter } from "./routes/datasets.js";
import { recordsRouter } from "./routes/records.js";
import { viewsRouter } from "./routes/views.js";

dotenv.config();

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Mount the Better Auth handler before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// REST API V1 Routes
app.use("/api/v1/datasets", datasetsRouter);
app.use("/api/v1/records", recordsRouter);
app.use("/api/v1/views", viewsRouter);
