import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const datasets = pgTable("datasets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  recordCount: integer("recordCount").notNull().default(0),
  byteSizeFormatted: text("byteSizeFormatted").notNull(),
  cluster: text("cluster").notNull(),
  throughputRate: text("throughputRate").notNull(),
  syncFrequency: text("syncFrequency").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  schemaJson: jsonb("schemaJson").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;

