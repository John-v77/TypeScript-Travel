import { vi } from "vitest";

/**
 * A stand-in for the API, for tests of components that fetch.
 *
 * RTK Query goes through `fetch`, so the seam is global fetch rather than the
 * hooks - the slices, transformResponse and the cache all run for real, and
 * only the network is faked:
 *
 *   mockApi({
 *     "tours": toursListResponse([makeTour()]),
 *     "users/my-favorites": { status: "success", data: [] },
 *   });
 *
 * Keys are matched as substrings of the request URL, longest first, so
 * "tours/5c88" wins over "tours" regardless of declaration order. An
 * unmatched request rejects loudly rather than hanging. setupTests.ts
 * unstubs fetch after every test.
 */

type Body =
  Record<string, unknown> | unknown[] | string | number | boolean | null;
type Handler = Body | (() => unknown);

export type MockApiOptions = {
  /** Routes whose response should be an error, with its status code. */
  failing?: Record<string, number>;
};

const jsonResponse = (body: unknown, status = 200) => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
    clone: () => response,
  };
  return response;
};

/** The URL out of whatever fetch was handed. */
const urlOf = (input: unknown): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return "";
};

export const mockApi = (
  routes: Record<string, Handler>,
  { failing = {} }: MockApiOptions = {},
) => {
  // Longest first so a specific path beats the collection it sits under.
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  const failingKeys = Object.keys(failing).sort((a, b) => b.length - a.length);

  const fetchMock = vi.fn((input: unknown) => {
    const url = urlOf(input);

    const failed = failingKeys.find(key => url.includes(key));
    if (failed !== undefined) {
      return Promise.resolve(
        jsonResponse(
          { status: "fail", message: `Mocked failure for ${failed}` },
          failing[failed],
        ),
      );
    }

    const match = keys.find(key => url.includes(key));
    if (match === undefined) {
      return Promise.reject(
        new Error(
          `mockApi: no handler for ${url}. Known routes: ${keys.join(", ") || "(none)"}`,
        ),
      );
    }

    const handler = routes[match];
    const body = typeof handler === "function" ? handler() : handler;
    return Promise.resolve(jsonResponse(body));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

/** The shape list endpoints answer with. */
export const listResponse = (items: unknown[]) => ({
  status: "success",
  results: items.length,
  data: items,
});

/** The shape a single-document endpoint answers with. */
export const dataResponse = (data: unknown) => ({
  status: "success",
  data,
});
