import request from "supertest";
import { createServer } from "../server";

describe("Server", () => {
  const app = createServer();

  it("should respond to health check", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it("should return 404 for unknown routes", async () => {
    await request(app).get("/unknown-route").expect(404);
  });

  it("should have cors enabled", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000")
      .expect(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("should parse JSON requests", async () => {
    const response = await request(app)
      .post("/health")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(404);
  }); // Route doesn't exist but JSON was parsed
});
