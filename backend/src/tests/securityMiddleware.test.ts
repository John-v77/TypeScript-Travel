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
});
