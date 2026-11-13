import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import dotenv from "dotenv";
import { db } from "../db/client.js";
import * as schema from "../db/schema/index.js";

dotenv.config();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "Viewer",
      },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  secret: process.env.BETTER_AUTH_SECRET || "bUTPIBfcvcIa3pTqAfliYBHlgxkAo0zO",
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
});
