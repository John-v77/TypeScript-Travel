import reducer, {
  addToCart,
  clearCart,
  clearUserCart,
  loadPersistedCart,
  persistCart,
  removeFromCart,
  replaceCart,
  selectCartItemCount,
  selectCartTotal,
  syncCartOnLogin,
  updateQuantity,
  type CartState,
} from "./cartSlice";
import { makeCartItem } from "../../utils/test-fixtures";

const jacket = makeCartItem({ id: "jacket", price: 200 });
const boots = makeCartItem({ id: "boots", price: 100 });

const withItems = (items = [jacket]): CartState => ({
  items,
  userId: null,
  lastUpdated: 0,
});

describe("cart reducers", () => {
  it("adds a new item with a quantity of one", () => {
    const state = reducer(withItems([]), addToCart({ ...jacket, quantity: 5 }));
    expect(state.items).toEqual([{ ...jacket, quantity: 1 }]);
  });

  it("bumps the quantity of an item already in the cart", () => {
    const state = reducer(withItems(), addToCart(jacket));
    expect(state.items[0].quantity).toBe(2);
  });

  it("removes one line, leaving the rest", () => {
    const state = reducer(withItems([jacket, boots]), removeFromCart("jacket"));
    expect(state.items.map(item => item.id)).toEqual(["boots"]);
  });

  it("sets a quantity, and removes the line at zero", () => {
    const three = reducer(
      withItems(),
      updateQuantity({ id: "jacket", quantity: 3 }),
    );
    expect(three.items[0].quantity).toBe(3);

    const gone = reducer(three, updateQuantity({ id: "jacket", quantity: 0 }));
    expect(gone.items).toEqual([]);
  });

  it("empties the cart", () => {
    expect(reducer(withItems([jacket, boots]), clearCart()).items).toEqual([]);
  });

  it("adopts the server's cart wholesale", () => {
    const state = reducer(withItems(), replaceCart([boots]));
    expect(state.items).toEqual([boots]);
  });

  it("forgets the user and the items on logout", () => {
    const state = reducer(
      { ...withItems(), userId: "user-1" },
      clearUserCart(),
    );
    expect(state).toMatchObject({ items: [], userId: null });
  });

  it("merges a server cart on login, keeping the higher quantity", () => {
    const state = reducer(
      withItems([{ ...jacket, quantity: 3 }]),
      syncCartOnLogin({
        userId: "user-1",
        serverCart: [{ ...jacket, quantity: 2 }, boots],
      }),
    );
    expect(state.userId).toBe("user-1");
    expect(state.items).toEqual([{ ...jacket, quantity: 3 }, boots]);
  });
});

describe("selectors", () => {
  it("counts items and totals line prices", () => {
    const state = {
      cart: withItems([
        { ...jacket, quantity: 2 },
        { ...boots, quantity: 1 },
      ]),
    };
    expect(selectCartItemCount(state)).toBe(3);
    expect(selectCartTotal(state)).toBe(500);
  });
});

describe("guest cart persistence", () => {
  it("saves and restores the cart", () => {
    persistCart(withItems([jacket]));
    expect(loadPersistedCart()?.items).toEqual([jacket]);
  });

  it("restores nothing when nothing was saved", () => {
    expect(loadPersistedCart()).toBeUndefined();
  });

  it("ignores a saved cart in an unexpected shape", () => {
    localStorage.setItem("cart", JSON.stringify({ items: "not a list" }));
    expect(loadPersistedCart()).toBeUndefined();
  });

  it("logs and ignores corrupted storage", () => {
    const logged = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    localStorage.setItem("cart", "{not json");

    expect(loadPersistedCart()).toBeUndefined();
    expect(logged).toHaveBeenCalled();
  });
});
