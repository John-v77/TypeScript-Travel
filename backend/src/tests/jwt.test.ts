import jwt from "jsonwebtoken";
import request from "supertest";
import { User, UserModel } from "../models/userModel";
import { signToken } from "../controllers/authController";
import { Request, Response, NextFunction } from "express";

const testSecret = "test-jwt-secred-key";
const testExpiry = "7d";

process.env.JWT_SECRET = testSecret;
process.env.JWT_EXPIRES_IN = testExpiry;

describe("JWT Fuctionality", () => {
  describe("signToken function", () => {
    const userId = "507f1f77bcf86cd799439012";
    const token = signToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, testSecret) as any;
    expect(decoded.id).toBe(userId);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  it("should create tokens with correct expiration", () => {
    const userId = "507f1f77bcf86cd799439012";
    const token = signToken(userId);

    const decoded = jwt.verify(token, testSecret) as any;
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;

    expect(decoded.exp - decoded.iat).toBe(sevenDaysInSeconds);
  });

  it("should create unique tokens for different users", () => {
    const userId1 = "507f1f77bcf86cd799439011";
    const userId2 = "507f1f77bcf86cd799439012";

    const token1 = signToken(userId1);
    const token2 = signToken(userId2);

    expect(token1).not.toBe(token2);
    const decoded1 = jwt.verify(token1, testSecret) as any;
    const decoded2 = jwt.verify(token2, testSecret) as any;

    expect(decoded1.id).toBe(userId1);
    expect(decoded2.id).toBe(userId2);
  });
});
