import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import * as schema from "./schema/index.js";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "";

const isRemoteHost = (urlStr: string): boolean => {
  try {
    const parsed = new URL(urlStr);
    return (
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1" &&
      parsed.hostname !== ""
    );
  } catch {
    return false;
  }
};

const isRemote = isRemoteHost(connectionString);

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : false,
      }
    : undefined
);

export const db = drizzle(pool, { schema });
