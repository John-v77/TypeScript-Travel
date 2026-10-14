import request from "supertest";
import { createServer } from "../server";
import { UserModel } from "../models/userModel";
import { ipKeyGenerator } from "express-rate-limit";
import { LoginLimiter, globalLimiter } from "../middleware/rateLimiter";

jest.mock("../models/userModel");
jest.mock("../utils/email/email", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendWelcome: jest.fn().mockResolvedValue(undefined),
  })),
}));
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

/** Forget every attempt so far, so each test starts with a full allowance. */
const resetLimiters = () => {
  for (const ip of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) {
    for (const key of [ip, ipKeyGenerator(ip)]) {
      LoginLimiter.resetKey(key);
      globalLimiter.resetKey(key);
    }
  }
};

describe("Rate Limiter", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    resetLimiters();

    // Mock successful user login for rate limiting tests
    const mockUser = {
      _id: { toString: () => "user123" },
      email: "test@example.com",
      correctPassword: jest.fn().mockResolvedValue(true),
    };

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    } as any);
  });

  describe("Login Rate Limiting", () => {
    it("should allow first login attempt", async () => {
      const response = await request(app).post("/api/v1/users/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should allow multiple login attempts within limit (5 attempts)", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      // Make 5 login attempts (should all succeed)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/api/v1/users/login")
          .send(loginData);

        expect(response.status).toBe(200);
      }
    });

    it("should block 6th login attempt within 1 hour window", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      // Make 5 successful attempts
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/v1/users/login").send(loginData);
      }

      // 6th attempt should be blocked
      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData);

      expect(response.status).toBe(429);
      expect(response.text).toBe(
        "Too many login attempts, please try again after an hour",
      );
    });

  
    it("cannot be bypassed with a spoofed X-Forwarded-For", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/v1/users/login")
          .set("X-Forwarded-For", `192.168.1.${String(i)}`)
          .send(loginData);
      }

      const spoofed = await request(app)
        .post("/api/v1/users/login")
        .set("X-Forwarded-For", "10.0.0.99")
        .send(loginData);

      expect(spoofed.status).toBe(429);
    });

    it("should have correct rate limit headers", async () => {
      const response = await request(app).post("/api/v1/users/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.headers["x-ratelimit-limit"]).toBe("5");
      expect(response.headers["x-ratelimit-remaining"]).toBe("4");
      expect(response.headers["x-ratelimit-reset"]).toBeDefined();
    });

    it("should count failed login attempts towards rate limit", async () => {
      // Mock failed login
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      } as any);

      const loginData = {
        email: "invalid@example.com",
        password: "wrongpassword",
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/api/v1/users/login")
          .send(loginData);

        expect(response.status).toBe(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData);

      expect(response.status).toBe(429);
      expect(response.text).toBe(
        "Too many login attempts, please try again after an hour",
      );
    });

    it("should use IP address as key for rate limiting", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .set("X-Forwarded-For", "203.0.113.1")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      // Rate limiter should have tracked this IP
    });

    it("should not affect other routes", async () => {
      // Make 5 login attempts to exhaust rate limit
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/v1/users/login").send(loginData);
      }

      // 6th login should be blocked
      const loginResponse = await request(app)
        .post("/api/v1/users/login")
        .send(loginData);

      expect(loginResponse.status).toBe(429);

      // But signup should still work
      const signupData = {
        name: "Test User",
        email: "newuser@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      const mockNewUser = {
        _id: { toString: () => "newuser123" },
        name: "Test User",
        email: "newuser@example.com",
      };

      mockUserModel.create.mockResolvedValue(mockNewUser as any);

      const signupResponse = await request(app)
        .post("/api/v1/users/signup")
        .send(signupData);

      expect(signupResponse.status).toBe(201);
    });

    it("should handle rate limiter configuration correctly", async () => {
      const response = await request(app).post("/api/v1/users/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);


      const resetTime = parseInt(response.headers["x-ratelimit-reset"]) * 1000;
      const currentTime = Date.now();
      const timeDiff = resetTime - currentTime;


      expect(timeDiff).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
      expect(timeDiff).toBeGreaterThan(55 * 60 * 1000); // At least 55 minutes
    });
  });
});
