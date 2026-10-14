import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { makeStore, type RootState } from "../../app/store";
import { useCart, useCartSync } from "./useCart";
import { selectCartItems } from "./cartSlice";
import {
  cartState,
  makeCartItem,
  makeGear,
  signedInState,
} from "../../utils/test-fixtures";
import { listResponse, mockApi } from "../../utils/test-api";

const jacketGear = makeGear({ _id: "jacket", price: 200 });
const bootsGear = makeGear({ _id: "boots", name: "Trail Boots", price: 100 });

const renderWithStore = <T,>(
  hook: () => T,
  preloadedState: Partial<RootState> = {},
) => {
  const store = makeStore(preloadedState);
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...renderHook(hook, { wrapper }) };
};

/** "METHOD /path" for every request fetch was handed. */
const requests = (fetchMock: ReturnType<typeof mockApi>) =>
  fetchMock.mock.calls.map(([request]) => {
    const { method, url } = request as Request;
    return `${method} ${url.replace("http://127.0.0.1:3000/api/v1", "")}`;
  });

describe("useCart", () => {
  it("keeps a guest's cart local, with no requests", () => {
    const fetchMock = mockApi({});
    const { result, store } = renderWithStore(() => useCart());

    act(() => {
      result.current.add(jacketGear);
      result.current.add(jacketGear);
      result.current.setQuantity("jacket", 5);
    });

    expect(selectCartItems(store.getState())).toEqual([
      expect.objectContaining({ id: "jacket", quantity: 5 }),
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves a signed-in user's new item, then adopts the stored cart", async () => {
    const fetchMock = mockApi({
      cart: listResponse([
        { _id: "line-1", user: "user-1", gear: jacketGear, quantity: 1 },
      ]),
    });
    const { result, store } = renderWithStore(() => useCart(), signedInState());

    act(() => {
      result.current.add(jacketGear);
    });

    await waitFor(() => {
      expect(selectCartItems(store.getState())).toEqual([
        expect.objectContaining({ id: "jacket", lineId: "line-1" }),
      ]);
    });
    expect(requests(fetchMock)).toEqual(["POST /cart", "GET /cart"]);
  });

  it("changes and removes stored lines by their line id", async () => {
    const fetchMock = mockApi({
      cart: listResponse([
        { _id: "line-1", user: "user-1", gear: jacketGear, quantity: 3 },
      ]),
    });
    const { result } = renderWithStore(() => useCart(), {
      ...signedInState(),
      ...cartState([makeCartItem({ id: "jacket", lineId: "line-1" })]),
    });

    act(() => {
      result.current.setQuantity("jacket", 3);
    });
    await waitFor(() => {
      expect(requests(fetchMock)).toContain("PATCH /cart/line-1");
    });

    act(() => {
      result.current.remove("jacket");
    });
    await waitFor(() => {
      expect(requests(fetchMock)).toContain("DELETE /cart/line-1");
    });
  });

  it("empties the stored cart in one request", async () => {
    const fetchMock = mockApi({ cart: listResponse([]) });
    const { result, store } = renderWithStore(() => useCart(), {
      ...signedInState(),
      ...cartState([makeCartItem({ lineId: "line-1" })]),
    });

    act(() => {
      result.current.empty();
    });

    expect(selectCartItems(store.getState())).toEqual([]);
    await waitFor(() => {
      expect(requests(fetchMock)).toContain("DELETE /cart/clear-cart");
    });
  });
});

describe("useCartSync", () => {
  it("does nothing for a visitor", () => {
    const fetchMock = mockApi({});
    renderWithStore(() => {
      useCartSync();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("merges the guest cart into the stored one on login", async () => {
    const before = [
      { _id: "line-1", user: "user-1", gear: jacketGear, quantity: 1 },
    ];
    const after = [
      { _id: "line-1", user: "user-1", gear: jacketGear, quantity: 3 },
      { _id: "line-2", user: "user-1", gear: bootsGear, quantity: 1 },
    ];
    // The first request reads the stored cart; everything after it (the
    // PATCH, the POST and the final read) sees the merged one.
    let calls = 0;
    const fetchMock = mockApi({
      cart: () => listResponse(calls++ === 0 ? before : after),
    });
    const { store } = renderWithStore(
      () => {
        useCartSync();
      },
      {
        ...signedInState(),
        ...cartState([
          makeCartItem({ id: "jacket", quantity: 3 }),
          makeCartItem({ id: "boots", name: "Trail Boots", quantity: 1 }),
        ]),
      },
    );

    // Jacket is on both sides (guest has more): PATCH it up to 3.
    // Boots is guest-only: POST it.
    await waitFor(() => {
      expect(requests(fetchMock)).toEqual(
        expect.arrayContaining(["PATCH /cart/line-1", "POST /cart"]),
      );
    });

    await waitFor(() => {
      expect(selectCartItems(store.getState())).toEqual([
        expect.objectContaining({ id: "jacket", quantity: 3 }),
        expect.objectContaining({ id: "boots", lineId: "line-2" }),
      ]);
    });
  });
});
