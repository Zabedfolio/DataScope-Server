import { Router } from "express";
import { db } from "../db/client.js";
import { records, NewRecordEntity } from "../db/schema/records.js";

export const recordsRouter = Router();

// POST /api/v1/records/ingest - Ingest single or batch telemetry records
recordsRouter.post("/ingest", async (req, res) => {
  try {
    const body = req.body;
    const items: NewRecordEntity[] = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "No records provided" });
    }

    // Format timestamps and assign defaults
    const recordsToInsert = items.map((item) => ({
      id: item.id || `pkt_0x${Math.random().toString(16).slice(2, 10)}`,
      datasetId: item.datasetId || "ds_k8s_telemetry",
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      cluster: item.cluster || "us-east-1a",
      service: item.service || "unknown-service",
      method: item.method || "POST",
      latency: typeof item.latency === "number" ? item.latency : 0.5,
      status: typeof item.status === "number" ? item.status : 200,
      summary: item.summary || "Telemetry event",
      payload: item.payload || {},
      rawHex: item.rawHex || "",
      tags: item.tags || [],
    }));

    const inserted = await db.insert(records).values(recordsToInsert).returning();

    return res.status(201).json({
      success: true,
      message: `Ingested ${inserted.length} records successfully`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to ingest records",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

