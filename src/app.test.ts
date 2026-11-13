import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("Health Check Endpoint", () => {
  it("GET /api/health should respond with status 200 and { status: 'ok' }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

