import { database } from "../database";
import mongoose from "mongoose";

describe("Database Connection", () => {
  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await database.disconnect();
    }
  });

  it("should connect to database successfully", async () => {
    process.env.DATABASE = "mongodb://localhost:27017/test-db";
    process.env.DATABASE_PASSWORD = "test";

    await expect(database.connect()).resolves.not.toThrow();
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should throw error when database config is missing", () => {
    // Store original values
    const originalDatabase = process.env.DATABASE;
    const originalPassword = process.env.DATABASE_PASSWORD;

    try {
      // Clear environment variables
      delete process.env.DATABASE;
      delete process.env.DATABASE_PASSWORD;

      // Mock dotenv to prevent it from reloading
      jest.doMock("dotenv", () => ({
        config: jest.fn(),
      }));

      // Clear module cache to force re-evaluation
      jest.resetModules();

      expect(() => {
        require("../database");
      }).toThrow("Database configuration missing");
    } finally {
      // Restore original values
      if (originalDatabase) process.env.DATABASE = originalDatabase;
      if (originalPassword) process.env.DATABASE_PASSWORD = originalPassword;

      // Reset mocks and modules
      jest.dontMock("dotenv");
      jest.resetModules();
    }
  });

  it("should disconnect from database successfully", async () => {
    process.env.DATABASE = "mongodb://localhost:27017/test-db";
    process.env.DATABASE_PASSWORD = "test";

    await database.connect();
    await expect(database.disconnect()).resolves.not.toThrow();
    expect(mongoose.connection.readyState).toBe(0);
  });

  it("should handle connection errors and rethrow them", async () => {
    // Mock mongoose.connect to reject
    const originalConnect = mongoose.connect;
    mongoose.connect = jest
      .fn()
      .mockRejectedValue(new Error("Connection failed"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    process.env.DATABASE = "mongodb://invalid:27017/test-db";
    process.env.DATABASE_PASSWORD = "test";

    await expect(database.connect()).rejects.toThrow("Connection failed");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Database connection failed:",
      expect.any(Error),
    );

    // Restore original
    mongoose.connect = originalConnect;
    consoleSpy.mockRestore();
  });

  it("should handle disconnection errors and rethrow them", async () => {
    // First connect successfully
    process.env.DATABASE = "mongodb://localhost:27017/test-db";
    process.env.DATABASE_PASSWORD = "test";
    await database.connect();

    // Mock mongoose.disconnect to reject
    const originalDisconnect = mongoose.disconnect;
    mongoose.disconnect = jest
      .fn()
      .mockRejectedValue(new Error("Disconnection failed"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(database.disconnect()).rejects.toThrow("Disconnection failed");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Database disconnection failed:",
      expect.any(Error),
    );

    // Restore original
    mongoose.disconnect = originalDisconnect;
    consoleSpy.mockRestore();
  });
});
