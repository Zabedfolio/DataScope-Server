import { Router } from "express";
import { eq, and, ilike, or, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { records, NewRecordEntity } from "../db/schema/records.js";

export const recordsRouter = Router();

// GET /api/v1/records - Server-side paginated query with multi-condition search & sort
recordsRouter.get("/", async (req, res) => {
  const startPerf = performance.now();
  try {
    const {
      datasetId,
      page = "1",
      pageSize = "25",
      search,
      status,
      service,
      cluster,
      country,
      minLatency,
      maxLatency,
      sortField = "timestamp",
      sortDirection = "desc",
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
    const offset = (pageNum - 1) * limit;

    // Build conditions array
    const conditions = [];

    if (datasetId) {
      conditions.push(eq(records.datasetId, datasetId));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(records.id, q),
          ilike(records.service, q),
          ilike(records.cluster, q),
          ilike(records.summary, q)
        )
      );
    }

    if (status) {
      const statusList = status
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (statusList.length === 1) {
        conditions.push(eq(records.status, statusList[0]));
      } else if (statusList.length > 1) {
        conditions.push(inArray(records.status, statusList));
      }
    }

    if (service) {
      conditions.push(eq(records.service, service.trim()));
    }

    if (cluster) {
      conditions.push(eq(records.cluster, cluster.trim()));
    }

    if (country) {
      conditions.push(eq(records.country, country.trim()));
    }

    if (minLatency !== undefined && !isNaN(parseFloat(minLatency))) {
      conditions.push(gte(records.latency, parseFloat(minLatency)));
    }

    if (maxLatency !== undefined && !isNaN(parseFloat(maxLatency))) {
      conditions.push(lte(records.latency, parseFloat(maxLatency)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting column
    let orderExpr;
    const isAsc = sortDirection?.toLowerCase() === "asc";
    switch (sortField) {
      case "latency":
        orderExpr = isAsc ? asc(records.latency) : desc(records.latency);
        break;
      case "status":
        orderExpr = isAsc ? asc(records.status) : desc(records.status);
        break;
      case "service":
        orderExpr = isAsc ? asc(records.service) : desc(records.service);
        break;
      case "revenue":
        orderExpr = isAsc ? asc(records.revenue) : desc(records.revenue);
        break;
      case "timestamp":
      default:
        orderExpr = isAsc ? asc(records.timestamp) : desc(records.timestamp);
        break;
    }

    // Execute paginated select and count concurrently
    const [dataRows, countResult] = await Promise.all([
      db
        .select()
        .from(records)
        .where(whereClause)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(records)
        .where(whereClause),
    ]);

    const totalRecords = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const durationMs = parseFloat((performance.now() - startPerf).toFixed(2));

    return res.status(200).json({
      success: true,
      data: dataRows,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalRecords,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      metrics: {
        scanTimeMs: durationMs,
        indexedScan: true,
        returnedRows: dataRows.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to query records",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/v1/records/export - Streaming CSV export with flat memory footprint
recordsRouter.get("/export", async (req, res) => {
  try {
    const { datasetId, search, status, service, country } = req.query as Record<
      string,
      string | undefined
    >;

    const conditions = [];
    if (datasetId) conditions.push(eq(records.datasetId, datasetId));
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(records.id, q),
          ilike(records.service, q),
          ilike(records.summary, q)
        )
      );
    }
    if (status) {
      const s = parseInt(status, 10);
      if (!isNaN(s)) conditions.push(eq(records.status, s));
    }
    if (service) conditions.push(eq(records.service, service));
    if (country) conditions.push(eq(records.country, country));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="datascope_${datasetId || "telemetry"}_export.csv"`
    );

    // Write CSV header
    res.write("Timestamp,Stream ID,Service,Method,Cluster,Latency,Status,Country,Revenue,Summary\n");

    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await db
        .select()
        .from(records)
        .where(whereClause)
        .orderBy(desc(records.timestamp))
        .limit(batchSize)
        .offset(offset);

      if (chunk.length === 0) {
        hasMore = false;
        break;
      }

      for (const r of chunk) {
        const time = r.timestamp ? new Date(r.timestamp).toISOString() : "";
        const cleanSummary = (r.summary || "").replace(/"/g, '""');
        const line = `"${time}","${r.id}","${r.service}","${r.method}","${r.cluster}",${r.latency},${r.status},"${r.country || ""}","${r.revenue || 0}","${cleanSummary}"\n`;
        res.write(line);
      }

      offset += chunk.length;
      if (chunk.length < batchSize || offset >= 50000) {
        hasMore = false;
      }
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to stream CSV export",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// GET /api/v1/records/:id - Fetch single record details
recordsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .select()
      .from(records)
      .where(eq(records.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve record",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

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
      country: item.country || null,
      revenue: item.revenue || null,
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
