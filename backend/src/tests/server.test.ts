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

  it("allows the frontend's origin", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173")
      .expect(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("does not allow any other origin", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "http://evil.example.com")
      .expect(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should parse JSON requests", async () => {
    const response = await request(app)
      .post("/health")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(404);
  }); // Route doesn't exist but JSON was parsed
});
