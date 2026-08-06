import mongoose from "mongoose";
import { database } from "../../database";
import { UserModel } from "../../models/userModel";

// Integration tests against a real MongoDB connection (DATABASE_LOCAL env
// var). Unlike the userRoutes.*.test.ts route tests, UserModel is NOT
// mocked here, so real Mongoose schema validation (unique email, password
// confirmation match, email format) actually runs.
describe("User Model (integration)", () => {
  const validUser = {
    name: "Jane Doe",
    email: "jane.integration@example.com",
    password: "password123",
    passwordConfirm: "password123",
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_LOCAL!);
    // Mongoose builds the `unique: true` email index asynchronously after
    // connect(); without waiting for it, the duplicate-email test below can
    // run before the index exists and the second create() would wrongly
    // succeed.
    await UserModel.init();
  });

  afterEach(async () => {
    await UserModel.deleteMany();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  it("should reject a duplicate email with a unique constraint error", async () => {
    await UserModel.create(validUser);

    await expect(
      UserModel.create({ ...validUser, name: "Someone Else" })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("should reject a passwordConfirm that doesn't match password", async () => {
    await expect(
      UserModel.create({ ...validUser, passwordConfirm: "somethingElse" })
    ).rejects.toMatchObject({
      errors: {
        passwordConfirm: expect.objectContaining({
          message: "Passwords are not the same!",
        }),
      },
    });
  });

  it("should reject a malformed email address", async () => {
    await expect(
      UserModel.create({ ...validUser, email: "not-an-email" })
    ).rejects.toMatchObject({
      errors: {
        email: expect.objectContaining({
          message: "Please provide a valid email",
        }),
      },
    });
  });
});
