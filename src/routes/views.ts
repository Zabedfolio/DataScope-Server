import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { savedViews, NewSavedView } from "../db/schema/views.js";

export const viewsRouter = Router();

// GET /api/v1/views - List all saved views
viewsRouter.get("/", async (_req, res) => {
  try {
    const views = await db
      .select()
      .from(savedViews)
      .orderBy(desc(savedViews.updatedAt));

    return res.status(200).json({ success: true, data: views });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch views",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/v1/views - Create a saved view
viewsRouter.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      datasetId,
      datasetName,
      description,
      filterRules = [],
      lastRunLatencyMs = 0.35,
      recordsMatched = 0,
      sharedWithTeam = false,
      userId = null,
    } = req.body;

    if (!title || !datasetId || !datasetName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, datasetId, datasetName",
      });
    }

    const newViewSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = `view_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newView: NewSavedView = {
      id,
      userId,
      title,
      slug: newViewSlug,
      datasetId,
      datasetName,
      description: description || "Custom saved view",
      filterRules,
      lastRunLatencyMs,
      recordsMatched,
      sharedWithTeam,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await db.insert(savedViews).values(newView).returning();

    return res.status(201).json({
      success: true,
      message: "Saved view created successfully",
      data: inserted[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create saved view",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// PATCH /api/v1/views/:id/share - Toggle share with team
viewsRouter.patch("/:id/share", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db
      .select()
      .from(savedViews)
      .where(eq(savedViews.id, id))
      .limit(1);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: "View not found" });
    }

    const updated = await db
      .update(savedViews)
      .set({
        sharedWithTeam: !existing[0].sharedWithTeam,
        updatedAt: new Date(),
      })
      .where(eq(savedViews.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Sharing status updated",
      data: updated[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update sharing status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/v1/views/:id - Delete a saved view
viewsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db
      .delete(savedViews)
      .where(eq(savedViews.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "View not found" });
    }

    return res.status(200).json({
      success: true,
      message: "View deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete view",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

