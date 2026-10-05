import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  /** The gear item's _id - one line per gear item. */
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  quantity: number;
  lineId?: string;
};

export type CartState = {
  items: CartItem[];
  userId: string | null;
  lastUpdated: number;
};

type UpdateQuantityPayload = {
  id: string;
  quantity: number;
};

type SyncCartOnLoginPayload = {
  userId: string;
  serverCart?: CartItem[];
};

const initialState: CartState = {
  items: [],
  userId: null,
  lastUpdated: Date.now(),
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(
        item => item.id === newItem.id,
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += 1;
      } else {
        state.items.push({ ...newItem, quantity: 1 });
      }

      state.lastUpdated = Date.now();
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.lastUpdated = Date.now();
    },

    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const { id, quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter(item => item.id !== id);
      } else {
        const existingIndex = state.items.findIndex(item => item.id === id);
        if (existingIndex >= 0) {
          state.items[existingIndex].quantity = quantity;
        }
      }

      state.lastUpdated = Date.now();
    },

    clearCart: state => {
      state.items = [];
      state.lastUpdated = Date.now();
    },

    syncCartOnLogin: (state, action: PayloadAction<SyncCartOnLoginPayload>) => {
      const { userId, serverCart = [] } = action.payload;
      state.userId = userId;

      const mergedItems = [...state.items];

      serverCart.forEach(serverItem => {
        const existingIndex = mergedItems.findIndex(
          item => item.id === serverItem.id,
        );
        if (existingIndex >= 0) {
          mergedItems[existingIndex].quantity = Math.max(
            mergedItems[existingIndex].quantity,
            serverItem.quantity,
          );
        } else {
          mergedItems.push(serverItem);
        }
      });

      state.items = mergedItems;
      state.lastUpdated = Date.now();
    },

    replaceCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.lastUpdated = Date.now();
    },

    clearUserCart: state => {
      state.userId = null;
      state.items = [];
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  syncCartOnLogin,
  clearUserCart,
  replaceCart,
} = cartSlice.actions;

const cartStorageKey = "cart";

export const loadPersistedCart = (): CartState | undefined => {
  try {
    const stored = localStorage.getItem(cartStorageKey);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored) as Partial<CartState>;

    if (!Array.isArray(parsed.items)) return undefined;

    return {
      items: parsed.items,
      userId: parsed.userId ?? null,
      lastUpdated: parsed.lastUpdated ?? Date.now(),
    };
  } catch (error) {
    console.error("Could not load the saved cart from localStorage:", error);
    return undefined;
  }
};

export const persistCart = (cart: CartState): void => {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save the cart to localStorage:", error);
  }
};

export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
export const selectCartUserId = (state: { cart: CartState }) =>
  state.cart.userId;

export default cartSlice.reducer;
