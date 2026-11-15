import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { datasets } from "./datasets.js";

export const records = pgTable("records", {
  id: text("id").primaryKey(),
  datasetId: text("datasetId")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  cluster: text("cluster").notNull(),
  service: text("service").notNull(),
  method: text("method").notNull(), // 'POST' | 'GET' | 'STREAM' | 'BATCH' | 'DELETE' | 'PUT'
  latency: real("latency").notNull(),
  status: integer("status").notNull(),
  summary: text("summary").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  rawHex: text("rawHex").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

export type RecordEntity = typeof records.$inferSelect;
export type NewRecordEntity = typeof records.$inferInsert;

