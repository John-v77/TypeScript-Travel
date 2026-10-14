import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Every test starts clean: no stubbed fetch from mockApi, and no saved cart or
// login left in localStorage by the test before.
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});
