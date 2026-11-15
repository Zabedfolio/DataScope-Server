import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema/index.js";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

// Disable prefetch/prepared statements for Supabase Transaction Pooler mode (PgBouncer)
export const client = postgres(connectionString, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(client, { schema });
