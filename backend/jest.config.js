/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  maxWorkers: 2,
  roots: ["./src/tests"],
  setupFiles: ["./src/tests/setupEnv.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { diagnostics: { ignoreCodes: [151002] } }],
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/tests/**"],
};
