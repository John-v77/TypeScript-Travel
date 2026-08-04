// Shared mock builders for the tourRoutes.*.test.ts suite. Not itself a test
// file (doesn't match the "*.test.ts" jest testRegex), so it's safe to import
// plain helpers here.

/**
 * Mongoose query mocks in this codebase are chainable: .sort()/.select()/
 * .skip()/.where() return `this`, and the chain is only resolved by the
 * final .limit() call. `result` can be a resolved value or an Error to
 * reject with, so both success and failure paths can share this builder.
 */
export function createMockQuery(result: unknown | Error) {
  const query = {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit:
      result instanceof Error
        ? jest.fn().mockRejectedValue(result)
        : jest.fn().mockResolvedValue(result),
  };
  return query;
}

// NOTE: the authController/tourController/sharp jest.mock() factories are
// intentionally NOT shared from here. ts-jest hoists jest.mock() calls above
// imports, so a factory that closes over an imported helper throws
// "Cannot access '...' before initialization" the moment the mocked module
// is required (confirmed empirically). Each test file below inlines its own
// factory instead.
