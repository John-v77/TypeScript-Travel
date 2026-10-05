import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { toursApiSlice } from "../features/tours/toursApiSlice";
import { authApiSlice } from "../features/authSlice/authApiSlice";
import { authStorageSlice } from "../features/authSlice/authStorageSlice";
import { themeSlice } from "../features/theme/themeSlice";
import { favoritesApiSlice } from "../features/favorites/favoritesApiSlice";
import { gearApiSlice } from "../features/gear/gearApiSlice";
import { gearCheckoutApiSlice } from "../features/gear/gearCheckoutApiSlice";
import {
  cartSlice,
  loadPersistedCart,
  persistCart,
} from "../features/cartSlice/cartSlice";
import { cartApiSlice } from "../features/cartSlice/cartApiSlice";

const rootReducer = combineSlices(
  toursApiSlice,
  authApiSlice,
  authStorageSlice,
  themeSlice,
  favoritesApiSlice,
  gearApiSlice,
  gearCheckoutApiSlice,
  cartSlice,
  cartApiSlice,
);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => {
      return getDefaultMiddleware().concat(
        toursApiSlice.middleware,
        authApiSlice.middleware,
        favoritesApiSlice.middleware,
        gearApiSlice.middleware,
        gearCheckoutApiSlice.middleware,
        cartApiSlice.middleware,
      );
    },
    preloadedState,
  });
  setupListeners(store.dispatch);
  return store;
};

const persistedCart = loadPersistedCart();
export const store = makeStore(persistedCart ? { cart: persistedCart } : {});
store.subscribe(() => {
  persistCart(store.getState().cart);
});

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
