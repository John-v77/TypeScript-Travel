import request from "supertest";
import { createServer } from "../server";

describe("Security Middleware", () => {
  const app = createServer();

  describe("Helmet Security Headers", () => {
    it("should set security headers for all routes", async () => {
      const response = await request(app).get("/health");

      // Check for common security headers set by helmet
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined(); // Can be DENY or SAMEORIGIN
      expect(response.headers["x-download-options"]).toBe("noopen");
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });

    it("should remove X-Powered-By header", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("should set Content-Security-Policy header", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["content-security-policy"]).toBeDefined();
    });
  });

  describe("Request Body Size Limits", () => {
    it("should accept requests within 1kb limit", async () => {
      const smallData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(smallData);

      // Should not be rejected due to size (may fail for other reasons)
      expect(response.status).not.toBe(413); // Payload Too Large
    }, 10000);

    it("should reject requests exceeding 1mb limit in test environment", async () => {
      // Create a payload larger than 1mb (test environment limit)
      const largeString = "x".repeat(2 * 1024 * 1024); // 2mb string
      const largeData = {
        name: largeString,
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(largeData);

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});
