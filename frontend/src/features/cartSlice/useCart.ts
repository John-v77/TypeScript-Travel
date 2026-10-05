import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectIsAuthenticated } from "../authSlice/authStorageSlice";
import type { Gear } from "../gear/gearApiSlice";
import {
  addToCart,
  clearCart,
  removeFromCart,
  replaceCart,
  selectCartItems,
  updateQuantity,
  type CartItem,
} from "./cartSlice";
import {
  useAddCartItemMutation,
  useLazyGetMyCartQuery,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useUpdateCartItemMutation,
  type CartLine,
} from "./cartApiSlice";


export const serverCartToItems = (lines: CartLine[]): CartItem[] =>
  lines.flatMap(line =>
    line.gear
      ? [
          {
            id: line.gear._id,
            name: line.gear.name,
            price: line.gear.price,
            image: line.gear.image,
            description: line.gear.description,
            category: line.gear.category,
            quantity: line.quantity,
            lineId: line._id,
          },
        ]
      : [],
  );


export const useCartSync = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const items = useAppSelector(selectCartItems);

  const [fetchCart] = useLazyGetMyCartQuery();
  const [addItem] = useAddCartItemMutation();
  const [updateItem] = useUpdateCartItemMutation();


  const itemsRef = useRef(items);
  itemsRef.current = items;

  // One merge per sign-in. Reset on sign-out so the next login merges again.
  const mergedThisSession = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      mergedThisSession.current = false;
      return;
    }

    if (mergedThisSession.current) return;
    mergedThisSession.current = true;

    void (async () => {
      try {
        const stored = await fetchCart(undefined).unwrap();

        await Promise.all(
          itemsRef.current.flatMap(item => {
            const line = stored.find(l => l.gear?._id === item.id);
            if (!line) {
              return [
                addItem({ gear: item.id, quantity: item.quantity }).unwrap(),
              ];
            }
            return item.quantity > line.quantity
              ? [
                  updateItem({
                    lineId: line._id,
                    quantity: item.quantity,
                  }).unwrap(),
                ]
              : [];
          }),
        );

        const merged = await fetchCart(undefined).unwrap();
        dispatch(replaceCart(serverCartToItems(merged)));
      } catch (error) {
        console.error("Could not sync the cart on login:", error);
      }
    })();
  }, [isAuthenticated, dispatch, fetchCart, addItem, updateItem]);
};

export const useCart = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const items = useAppSelector(selectCartItems);

  const [fetchCart] = useLazyGetMyCartQuery();
  const [addItem] = useAddCartItemMutation();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearServerCart] = useClearCartMutation();

  /** Run the server writes, then adopt the stored cart. */
  const writeThrough = useCallback(
    async (writes: Promise<unknown>[]) => {
      try {
        await Promise.all(writes);
        const stored = await fetchCart(undefined).unwrap();
        dispatch(replaceCart(serverCartToItems(stored)));
      } catch (error) {
        console.error("Could not save the cart change to the server:", error);
      }
    },
    [dispatch, fetchCart],
  );

  const add = useCallback(
    (gear: Gear) => {
      const existing = items.find(item => item.id === gear._id);
      dispatch(
        addToCart({
          id: gear._id,
          name: gear.name,
          price: gear.price,
          image: gear.image,
          description: gear.description,
          category: gear.category,
          quantity: 1,
        }),
      );
      if (!isAuthenticated) return;

      // A gear item has one stored line: bump it if it exists, else create it.
      void writeThrough([
        existing?.lineId
          ? updateItem({
              lineId: existing.lineId,
              quantity: existing.quantity + 1,
            }).unwrap()
          : addItem({ gear: gear._id, quantity: 1 }).unwrap(),
      ]);
    },
    [items, dispatch, isAuthenticated, addItem, updateItem, writeThrough],
  );

  const setQuantity = useCallback(
    (gearId: string, quantity: number) => {
      const lineId = items.find(item => item.id === gearId)?.lineId;
      dispatch(updateQuantity({ id: gearId, quantity }));
      if (!isAuthenticated) return;
      if (!lineId) {
        if (quantity > 0) {
          void writeThrough([addItem({ gear: gearId, quantity }).unwrap()]);
        }
        return;
      }
      void writeThrough([
        quantity <= 0
          ? removeItem(lineId).unwrap()
          : updateItem({ lineId, quantity }).unwrap(),
      ]);
    },
    [
      items,
      dispatch,
      isAuthenticated,
      addItem,
      updateItem,
      removeItem,
      writeThrough,
    ],
  );

  const remove = useCallback(
    (gearId: string) => {
      const lineId = items.find(item => item.id === gearId)?.lineId;
      dispatch(removeFromCart(gearId));
      if (isAuthenticated && lineId) {
        void writeThrough([removeItem(lineId).unwrap()]);
      }
    },
    [items, dispatch, isAuthenticated, removeItem, writeThrough],
  );

  const empty = useCallback(() => {
    dispatch(clearCart());
    if (isAuthenticated) {
      void writeThrough([clearServerCart(undefined).unwrap()]);
    }
  }, [dispatch, isAuthenticated, clearServerCart, writeThrough]);

  return useMemo(
    () => ({ add, setQuantity, remove, empty }),
    [add, setQuantity, remove, empty],
  );
};
