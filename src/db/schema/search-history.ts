import { pgTable, text, integer, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const searchHistory = pgTable(
  "search_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default("usr_alex_mercer"),
    queryText: text("query_text").notNull(),
    filtersJson: jsonb("filters_json").$type<Record<string, unknown>>().notNull().default({}),
    resultCount: integer("result_count").notNull().default(0),
    executionDurationMs: real("execution_duration_ms").notNull().default(0.3),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_search_history_user").on(table.userId),
    index("idx_search_history_time").on(table.createdAt),
  ]
);

export type SearchHistoryEntity = typeof searchHistory.$inferSelect;
export type NewSearchHistoryEntity = typeof searchHistory.$inferInsert;

