// Shared fixtures and JWT env setup for the userRoutes.*.test.ts suite. Not
// itself a test file (doesn't match the "*.test.ts" jest testRegex), so it's
// safe to import plain helpers here.

process.env.JWT_SECRET = "test-jwt-secret-key-for-user-routes";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";

export const validSignup = {
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  passwordConfirm: "password123",
};

export const validLogin = {
  email: "john@example.com",
  password: "password123",
};

export const authHeader = { Authorization: "Bearer valid-jwt-token" };

/**
 * Mongoose query mocks in this codebase are chainable: .sort()/.select()/
 * .skip() return `this`, and the chain is only resolved by the final
 * .limit() call. `result` can be a resolved value or an Error to reject
 * with, so both success and failure paths can share this builder.
 */
export function createMockFindQuery(result: unknown | Error) {
  const query = {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit:
      result instanceof Error
        ? jest.fn().mockRejectedValue(result)
        : jest.fn().mockResolvedValue(result),
  };
  return query;
}

// NOTE: jest.mock() factories are intentionally NOT shared from here. Each
// test file below inlines its own authController/Email/sharp mock factory —
// see the equivalent note in ../tourRoutes/testHelpers.ts for why closing
// over an imported helper breaks ts-jest's hoisting.
