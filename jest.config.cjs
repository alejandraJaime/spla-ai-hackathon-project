/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  // The AI SDK ships ESM-only builds, as do some of its transitive deps
  // (@ai-sdk/*, @workflow/*, ...); transform node_modules instead of
  // leaving it ignored, rather than chasing each ESM package by name.
  transformIgnorePatterns: [],
};
