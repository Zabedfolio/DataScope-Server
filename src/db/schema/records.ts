import { pgTable, text, integer, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { datasets } from "./datasets.js";

export const records = pgTable(
  "records",
  {
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
    country: text("country"),
    revenue: real("revenue"),
    summary: text("summary").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    rawHex: text("rawHex").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_records_dataset_status").on(table.datasetId, table.status),
    index("idx_records_dataset_time").on(table.datasetId, table.timestamp),
    index("idx_records_service").on(table.service),
    index("idx_records_country").on(table.country),
    index("idx_records_latency").on(table.latency),
  ]
);

export type RecordEntity = typeof records.$inferSelect;
export type NewRecordEntity = typeof records.$inferInsert;
