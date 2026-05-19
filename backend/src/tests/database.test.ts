import mongoose from "mongoose";

jest.mock("mongoose");

const mockConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>;
const mockDisconnect = mongoose.disconnect as jest.MockedFunction<typeof mongoose.disconnect>;

let database: { connect: () => Promise<void>; disconnect: () => Promise<void> };

beforeAll(() => {
  process.env.DATABASE = "mongodb+srv://test:<db_password>@cluster.mongodb.net";
  process.env.DATABASE_PASSWORD = "testpassword";
  ({ database } = require("../database"));
});

afterEach(() => jest.clearAllMocks());

describe("Database connect()", () => {
  it("resolves when mongoose connects successfully", async () => {
    mockConnect.mockResolvedValueOnce(undefined as never);
    await expect(database.connect()).resolves.toBeUndefined();
  });

  it("rejects with the actual error when mongoose.connect fails", async () => {
    const realError = new Error("connection refused");
    mockConnect.mockRejectedValueOnce(realError);
    await expect(database.connect()).rejects.toThrow("connection refused");
  });
});

describe("Database disconnect()", () => {
  it("resolves when mongoose disconnects successfully", async () => {
    mockDisconnect.mockResolvedValueOnce(undefined);
    await expect(database.disconnect()).resolves.toBeUndefined();
  });

  it("rejects with the actual error when mongoose.disconnect fails", async () => {
    const realError = new Error("disconnect failed");
    mockDisconnect.mockRejectedValueOnce(realError);
    await expect(database.disconnect()).rejects.toThrow("disconnect failed");
  });
});
