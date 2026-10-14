import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { makeStore, type RootState } from "../../app/store";
import { useFavorites } from "./useFavorites";
import { makeTour, signedInState } from "../../utils/test-fixtures";
import { dataResponse, mockApi } from "../../utils/test-api";

const saved = makeTour({ id: "saved-tour" });

const renderFavorites = (preloadedState: Partial<RootState> = {}) => {
  const store = makeStore(preloadedState);
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useFavorites(), { wrapper });
};

/** The method and URL of every request fetch was handed. */
const requests = (fetchMock: ReturnType<typeof mockApi>) =>
  fetchMock.mock.calls.map(([request]) => {
    const { method, url } = request as Request;
    return `${method} ${url}`;
  });

describe("useFavorites", () => {
  it("does nothing for a visitor", () => {
    const fetchMock = mockApi({});
    const { result } = renderFavorites();

    expect(result.current.signedIn).toBe(false);
    expect(result.current.isFavorite("saved-tour")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("knows which tours a signed-in user saved", async () => {
    mockApi({
      "users/my-favorites": dataResponse([
        { id: "fav-1", tour: saved, user: "user-1" },
      ]),
    });
    const { result } = renderFavorites(signedInState());

    await waitFor(() => {
      expect(result.current.isFavorite("saved-tour")).toBe(true);
    });
    expect(result.current.isFavorite("other-tour")).toBe(false);
  });

  it("adds a tour that is not saved yet", async () => {
    const fetchMock = mockApi({ "users/my-favorites": dataResponse([]) });
    const { result } = renderFavorites(signedInState());
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    result.current.toggle("new-tour");

    await waitFor(() => {
      expect(requests(fetchMock)).toContain(
        "POST http://127.0.0.1:3000/api/v1/users/my-favorites",
      );
    });
  });

  it("removes a tour that is already saved, by its favourite id", async () => {
    const fetchMock = mockApi({
      "users/my-favorites": dataResponse([
        { id: "fav-1", tour: saved, user: "user-1" },
      ]),
    });
    const { result } = renderFavorites(signedInState());
    await waitFor(() => {
      expect(result.current.isFavorite("saved-tour")).toBe(true);
    });

    result.current.toggle("saved-tour");

    await waitFor(() => {
      expect(requests(fetchMock)).toContain(
        "DELETE http://127.0.0.1:3000/api/v1/users/my-favorites/fav-1",
      );
    });
  });
});
