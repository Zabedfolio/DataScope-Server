import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import dotenv from "dotenv";
import { db } from "../db/client.js";

dotenv.config();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  secret: process.env.BETTER_AUTH_SECRET || "default_dev_secret_must_be_overridden_in_production",
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
  // Disable runtime schema validation until auth schema/migrations are generated
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  // TODO: The schema will be generated later with the Better Auth CLI (e.g. npx @better-auth/cli generate)
});

