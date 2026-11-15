import { Router } from "express";
import { eq, or, ilike, desc, asc, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { datasets } from "../db/schema/datasets.js";
import { records } from "../db/schema/records.js";

export const datasetsRouter = Router();

// GET /api/v1/datasets - List all datasets
datasetsRouter.get("/", async (_req, res) => {
  try {
    const allDatasets = await db.select().from(datasets);
    return res.status(200).json({ success: true, data: allDatasets });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch datasets",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/v1/datasets/:id - Get dataset by ID or slug
datasetsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const found = await db
      .select()
      .from(datasets)
      .where(or(eq(datasets.id, id), eq(datasets.slug, id)))
      .limit(1);

    if (!found || found.length === 0) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    return res.status(200).json({ success: true, data: found[0] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dataset",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/v1/datasets/:id/records - Query records with filters, pagination, and sorting
datasetsRouter.get("/:id/records", async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const service = req.query.service as string | undefined;
  const search = req.query.search as string | undefined;
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

  try {
    const conditions = [
      or(eq(records.datasetId, id), eq(records.datasetId, `ds_${id}`)),
    ];

    if (service) {
      conditions.push(eq(records.service, service));
    }

    if (search) {
      conditions.push(
        or(
          ilike(records.summary, `%${search}%`),
          ilike(records.id, `%${search}%`),
          ilike(records.service, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);
    const orderClause = sortDir === "asc" ? asc(records.timestamp) : desc(records.timestamp);

    const results = await db
      .select()
      .from(records)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        count: results.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch records",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

