import { pgTable, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { datasets } from "./datasets.js";

export const savedViews = pgTable("saved_views", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  datasetId: text("datasetId")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  datasetName: text("datasetName").notNull(),
  description: text("description").notNull(),
  filterRules: jsonb("filterRules").$type<string[]>().notNull().default([]),
  lastRunLatencyMs: real("lastRunLatencyMs").notNull().default(0),
  recordsMatched: integer("recordsMatched").notNull().default(0),
  sharedWithTeam: boolean("sharedWithTeam").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;

