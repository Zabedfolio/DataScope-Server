import dotenv from "dotenv";
dotenv.config();

import { db, client } from "./client.js";
import { records, NewRecordEntity } from "./schema/records.js";

const TOTAL_RECORDS = 100000;
const BATCH_SIZE = 2500;

const DATASETS = [
  { id: "ds_k8s_telemetry", count: 50000 },
  { id: "ds_fin_orderbook", count: 25000 },
  { id: "ds_payment_ledger", count: 25000 },
];

const SERVICES = [
  "auth-gateway",
  "query-engine",
  "ingress-gateway",
  "shard-replicator",
  "rate-limiter",
  "nvme-storage",
  "order-router",
  "matching-engine",
  "settlement-svc",
  "ledger-vault",
];

const METHODS = ["GET", "POST", "STREAM", "BATCH", "PUT", "DELETE"];
const CLUSTERS = ["us-east-1a", "us-east-1b", "us-west-2a", "eu-west-1c", "ap-southeast-1a", "eu-central-1a"];
const STATUS_CODES = [200, 200, 200, 200, 200, 200, 400, 401, 429, 500, 503];
const COUNTRIES = ["Germany", "United States", "United Kingdom", "Japan", "Singapore", "France", "Canada", "Australia"];
const SYMBOLS = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "BTC-USD", "ETH-USD"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function generateBatch(datasetId: string, startIndex: number, count: number): NewRecordEntity[] {
  const batch: NewRecordEntity[] = [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const globalIdx = startIndex + i;
    const hexId = globalIdx.toString(16).padStart(8, "0");
    const id = `pkt_0x${hexId}`;
    const service = getRandomItem(SERVICES);
    const method = getRandomItem(METHODS);
    const cluster = getRandomItem(CLUSTERS);
    const status = getRandomItem(STATUS_CODES);
    const country = getRandomItem(COUNTRIES);
    const revenue = getRandomFloat(150, 125000, 2);
    const latency = getRandomFloat(0.15, 85.0, 2);
    const timeOffset = Math.floor(Math.random() * thirtyDaysMs);
    const timestamp = new Date(now - timeOffset);

    let summary = `Handled ${method} request for ${service} on ${cluster}`;
    if (datasetId === "ds_fin_orderbook") {
      const sym = getRandomItem(SYMBOLS);
      summary = `HFT execution event for ${sym} at bid ${getRandomFloat(100, 800)} vol ${Math.floor(Math.random() * 5000)}`;
    } else if (datasetId === "ds_payment_ledger") {
      summary = `Settled transaction for merchant in ${country} with amount $${revenue}`;
    }

    batch.push({
      id,
      datasetId,
      timestamp,
      cluster,
      service,
      method,
      latency,
      status,
      country,
      revenue,
      summary,
      tags: [service, method.toLowerCase(), `status-${status}`],
      rawHex: `00000000: ${hexId.slice(0, 4)} ${hexId.slice(4, 8)} 0000 0001  PKT_${hexId.toUpperCase()}....`,
      payload: {
        record_seq: globalIdx,
        service_tier: status === 200 ? "standard" : "elevated",
        datacenter: cluster,
        country,
        revenue,
        simd_scanned: true,
      },
      createdAt: timestamp,
    });
  }

  return batch;
}

async function run100kSeed() {
  console.log(`🚀 Starting generation of ${TOTAL_RECORDS.toLocaleString()} records into Supabase PostgreSQL...`);
  const startTime = Date.now();

  try {
    let globalCounter = 0;

    for (const ds of DATASETS) {
      console.log(`\n📦 Generating ${ds.count.toLocaleString()} records for dataset [${ds.id}]...`);
      const batches = ds.count / BATCH_SIZE;

      for (let b = 0; b < batches; b++) {
        const batch = generateBatch(ds.id, globalCounter, BATCH_SIZE);
        await db.insert(records).values(batch).onConflictDoNothing();
        globalCounter += BATCH_SIZE;

        const percent = ((globalCounter / TOTAL_RECORDS) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${globalCounter.toLocaleString()} / ${TOTAL_RECORDS.toLocaleString()} rows (${percent}%)`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n✅ Successfully seeded ${TOTAL_RECORDS.toLocaleString()} records in ${elapsed}s!`);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run100kSeed();

