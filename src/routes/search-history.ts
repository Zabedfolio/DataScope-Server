import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { searchHistory } from "../db/schema/search-history.js";

export const searchHistoryRouter = Router();

// GET /api/v1/search-history - Retrieve recent search queries
searchHistoryRouter.get("/", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "usr_alex_mercer";
    const history = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(10);

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch search history",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/v1/search-history - Record an executed search query
searchHistoryRouter.post("/", async (req, res) => {
  try {
    const { queryText, filtersJson, resultCount, executionDurationMs, userId } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ success: false, message: "Query text is required" });
    }

    const newEntry = {
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId || "usr_alex_mercer",
      queryText: queryText.trim(),
      filtersJson: filtersJson || {},
      resultCount: typeof resultCount === "number" ? resultCount : 0,
      executionDurationMs: typeof executionDurationMs === "number" ? executionDurationMs : 0.35,
    };

    const inserted = await db.insert(searchHistory).values(newEntry).returning();

    return res.status(201).json({ success: true, data: inserted[0] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record search query",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/v1/search-history/:id - Delete an entry
searchHistoryRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(searchHistory).where(eq(searchHistory.id, id));
    return res.status(200).json({ success: true, message: "History item deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete history item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
