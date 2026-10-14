import { makeStore } from "../../app/store";
import { toursApiSlice } from "./toursApiSlice";
import { makeTour } from "../../utils/test-fixtures";
import { dataResponse, listResponse, mockApi } from "../../utils/test-api";

/** The URL of the n-th request fetch was handed. */
const requestedUrl = (fetchMock: ReturnType<typeof mockApi>, n = 0) =>
  (fetchMock.mock.calls[n][0] as Request).url;

describe("toursApiSlice", () => {
  it("fetches every tour from /tours and returns them as a list", async () => {
    const tours = [makeTour({ id: "a" }), makeTour({ id: "b" })];
    const fetchMock = mockApi({ tours: listResponse(tours) });
    const store = makeStore();

    const result = await store.dispatch(
      toursApiSlice.endpoints.getAllTours.initiate(),
    );

    expect(requestedUrl(fetchMock)).toBe("http://127.0.0.1:3000/api/v1/tours");
    expect(result.data).toEqual(tours);
  });

  it("also accepts the list keyed by id", async () => {
    const a = makeTour({ id: "a" });
    const b = makeTour({ id: "b" });
    mockApi({ tours: { status: "success", results: 2, data: { a, b } } });
    const store = makeStore();

    const result = await store.dispatch(
      toursApiSlice.endpoints.getAllTours.initiate(),
    );

    expect(result.data).toEqual([a, b]);
  });

  it("fetches one tour by its slug", async () => {
    const tour = makeTour({ slug: "the-sea-explorer" });
    const fetchMock = mockApi({
      "tours/the-sea-explorer": dataResponse(tour),
    });
    const store = makeStore();

    const result = await store.dispatch(
      toursApiSlice.endpoints.getTourBySlug.initiate("the-sea-explorer"),
    );

    expect(requestedUrl(fetchMock)).toBe(
      "http://127.0.0.1:3000/api/v1/tours/the-sea-explorer",
    );
    expect(result.data).toEqual(tour);
  });

  it("reports an error when the request fails", async () => {
    mockApi({}, { failing: { tours: 500 } });
    const store = makeStore();

    const result = await store.dispatch(
      toursApiSlice.endpoints.getAllTours.initiate(),
    );

    expect(result.isError).toBe(true);
    expect(result.data).toBeUndefined();
  });
});
