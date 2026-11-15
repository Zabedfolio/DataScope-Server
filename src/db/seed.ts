import dotenv from "dotenv";
dotenv.config();

import { db, client } from "./client.js";
import { datasets } from "./schema/datasets.js";
import { records } from "./schema/records.js";
import { savedViews } from "./schema/views.js";

async function seed() {
  console.log("🌱 Starting DataScope database seeding...");

  try {
    // 1. Seed Datasets
    console.log("Seeding datasets...");
    const sampleDatasets = [
      {
        id: "ds_k8s_telemetry",
        name: "K8s Microservice Telemetry",
        slug: "k8s-telemetry",
        description: "Distributed trace spans, mesh egress logs, and service health metrics.",
        recordCount: 14829000,
        byteSizeFormatted: "48.2 GB",
        cluster: "US-East-Primary (12 Shards)",
        throughputRate: "2.48 Gbps",
        syncFrequency: "Real-time (0.2s)",
        tags: ["Streaming", "gRPC", "Protobuf", "Mesh"],
        schemaJson: {
          id: { type: "string", indexed: true },
          timestamp: { type: "timestamp", indexed: true },
          service: { type: "string", indexed: true },
          latency: { type: "number", unit: "ms" },
          status: { type: "number", indexed: true },
        },
      },
      {
        id: "ds_fin_orderbook",
        name: "Financial L2 Order Book Ticks",
        slug: "financial-l2",
        description: "High-frequency limit order snapshots, market depth ticks, and trade execution events.",
        recordCount: 92410000,
        byteSizeFormatted: "184.6 GB",
        cluster: "US-West-HFT (8 Shards)",
        throughputRate: "4.12 Gbps",
        syncFrequency: "Sub-millisecond",
        tags: ["Financial", "Cap'n Proto", "Low-Latency"],
        schemaJson: {
          symbol: { type: "string", indexed: true },
          bid: { type: "number" },
          ask: { type: "number" },
          volume: { type: "number" },
        },
      },
      {
        id: "ds_payment_ledger",
        name: "Cross-Region Payment Ledger",
        slug: "payment-ledger",
        description: "Cryptographically verified financial settlement transactions and double-entry logs.",
        recordCount: 6840000,
        byteSizeFormatted: "14.8 GB",
        cluster: "EU-Central-Vault (16 Shards)",
        throughputRate: "1.84 Gbps",
        syncFrequency: "Quorum ACK (1.0s)",
        tags: ["Ledger", "PCI-DSS", "Blake3", "Audit"],
        schemaJson: {
          tx_id: { type: "string", indexed: true },
          sender: { type: "string" },
          receiver: { type: "string" },
          amount_cents: { type: "number" },
        },
      },
      {
        id: "ds_iot_sensor_mesh",
        name: "IoT Edge Sensor Stream",
        slug: "iot-sensors",
        description: "Automotive telemetry, vibration sensors, and industrial thermocouple feeds.",
        recordCount: 32150000,
        byteSizeFormatted: "29.4 GB",
        cluster: "Global-Mesh (24 Shards)",
        throughputRate: "890 Mbps",
        syncFrequency: "1.5s Adaptive",
        tags: ["Sensors", "MQTT", "Zero-Copy"],
        schemaJson: {
          device_id: { type: "string", indexed: true },
          temperature: { type: "number" },
          vibration_hz: { type: "number" },
          battery_pct: { type: "number" },
        },
      },
    ];

    for (const ds of sampleDatasets) {
      await db.insert(datasets).values(ds).onConflictDoNothing();
    }
    console.log(`✅ Datasets seeded: ${sampleDatasets.length}`);

    // 2. Seed Records
    console.log("Seeding initial telemetry records...");
    const initialRecords = [
      {
        id: "pkt_0x8f4a21e0",
        datasetId: "ds_k8s_telemetry",
        timestamp: new Date(Date.now() - 1000 * 5),
        cluster: "us-east-1a",
        service: "ingress-gateway",
        method: "STREAM",
        latency: 0.28,
        status: 200,
        summary: "Ingested 1,048,576 bytes binary telemetry stream from node-mesh-04",
        tags: ["mesh", "network"],
        rawHex: "00000000: 4461 7461 5363 6f70 6500 0100 7f4a 8c01  DataScope...J..\n00000010: b39d 21e0 000f 4240 0000 0418 0000 0001  ..!...B@........\n00000020: 7573 2d65 6173 742d 3161 0000 0000 0000  us-east-1a......",
        payload: {
          stream_id: "str_live_telemetry_v2",
          byte_count: 1048576,
          checksum: "0x7F4A8C01B39D",
          compression: "zstd-fast",
          compression_ratio: 0.42,
          shards_mapped: ["shard-01", "shard-03", "shard-07"],
        },
      },
      {
        id: "pkt_0x9a3c10f8",
        datasetId: "ds_k8s_telemetry",
        timestamp: new Date(Date.now() - 1000 * 15),
        cluster: "us-east-1b",
        service: "query-engine",
        method: "GET",
        latency: 0.34,
        status: 200,
        summary: "Executed sub-millisecond memory-mapped index lookup for tenant_9942",
        tags: ["cache-hit", "mmap"],
        rawHex: "00000000: 5155 4552 595f 4143 4b00 0000 9942 0000  QUERY_ACK...B..\n00000010: 0000 0154 0000 bc40 0000 0032 0000 0001  ...T...@...2....\n00000020: 0100 0000 0000 0000 0000 0000 0000 0000  ................",
        payload: {
          query: "SELECT telemetry FROM stream WHERE fid = '0x9942' LIMIT 50",
          cache_hit: true,
          storage_tier: "NVMe-mmap",
          scanned_rows: 48200,
          scan_duration_us: 340,
        },
      },
      {
        id: "pkt_0x7b11d942",
        datasetId: "ds_k8s_telemetry",
        timestamp: new Date(Date.now() - 1000 * 30),
        cluster: "eu-west-1c",
        service: "auth-gateway",
        method: "POST",
        latency: 1.15,
        status: 200,
        summary: "mTLS handshake verified: client_cert_cn=agent-collector-eu.internal",
        tags: ["mTLS", "security"],
        rawHex: "00000000: 544c 535f 4143 4b00 0000 0001 0000 0030  TLS_ACK.....0\n00000010: 6167 656e 742d 636f 6c6c 6563 746f 722d  agent-collector-\n00000020: 6575 2e69 6e74 6572 6e61 6c00 0000 0000  eu.internal.....",
        payload: {
          cert_fingerprint: "SHA256:88:fe:91:20:da:44:b1:90:34:bb:aa:19",
          cipher_suite: "TLS_AES_256_GCM_SHA384",
          session_resumed: false,
        },
      },
      {
        id: "pkt_0x110bc87e",
        datasetId: "ds_k8s_telemetry",
        timestamp: new Date(Date.now() - 1000 * 60),
        cluster: "us-east-1a",
        service: "storage-node-03",
        method: "BATCH",
        latency: 48.6,
        status: 500,
        summary: "Disk I/O backpressure reached 98% queue capacity on volume /mnt/wal-03",
        tags: ["error", "disk-io"],
        rawHex: "00000000: 4552 524f 525f 494f 0000 0062 0000 0003  ERROR_IO...b....\n00000010: 2f6d 6e74 2f77 616c 2d30 3300 0000 0000  /mnt/wal-03.....",
        payload: {
          error_code: "E_DISK_BACKPRESSURE",
          volume: "/mnt/wal-03",
          queue_depth: 1024,
          max_queue: 1024,
          dropped_frames: 42,
        },
      },
    ];

    for (const rec of initialRecords) {
      await db.insert(records).values(rec).onConflictDoNothing();
    }
    console.log(`✅ Telemetry records seeded: ${initialRecords.length}`);

    // 3. Seed Saved Views
    console.log("Seeding saved views...");
    const sampleViews = [
      {
        id: "view_outages_prod",
        title: "Critical 5xx Outages (Production Shards)",
        slug: "5xx-outages",
        datasetName: "K8s Microservice Telemetry",
        datasetId: "ds_k8s_telemetry",
        description: "Monitors cross-region mesh connection timeouts, quorum disconnects, and panic restarts.",
        filterRules: ["status >= 500", "latency > 50ms", "cluster == 'us-east-1a'"],
        lastRunLatencyMs: 0.38,
        recordsMatched: 142,
        sharedWithTeam: true,
      },
      {
        id: "view_hft_slippage",
        title: "P99 Latency Spikes (>20ms on NVMe Cache)",
        slug: "hft-latency-spikes",
        datasetName: "Financial L2 Order Book Ticks",
        datasetId: "ds_fin_orderbook",
        description: "Isolates order book tick events exceeding execution SLA thresholds on market exchanges.",
        filterRules: ["latency > 20ms", "method == 'STREAM'", "symbols IN ('NVDA', 'AAPL')"],
        lastRunLatencyMs: 0.42,
        recordsMatched: 28,
        sharedWithTeam: true,
      },
      {
        id: "view_auth_failures",
        title: "Security Handshake & mTLS Rejections",
        slug: "security-handshakes",
        datasetName: "K8s Microservice Telemetry",
        datasetId: "ds_k8s_telemetry",
        description: "Tracks expired token signatures, rogue IP probes, and invalid cryptographic certificates.",
        filterRules: ["status == 401", "service == 'auth-gateway'"],
        lastRunLatencyMs: 0.29,
        recordsMatched: 840,
        sharedWithTeam: false,
      },
    ];

    for (const v of sampleViews) {
      await db.insert(savedViews).values(v).onConflictDoNothing();
    }
    console.log(`✅ Saved views seeded: ${sampleViews.length}`);

    console.log("🚀 DataScope database seed complete!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await client.end();
  }
}

seed();

