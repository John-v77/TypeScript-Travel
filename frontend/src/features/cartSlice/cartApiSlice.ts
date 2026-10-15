import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Gear } from "../gear/gearApiSlice";
import { apiUrl } from "../../config/api";

export type CartLine = {
  _id: string;
  user: string;
  gear: Gear | null;
  quantity: number;
};

type CartLinesResponse = {
  status: string;
  results: number;
  data: CartLine[];
};

export const cartApiSlice = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/cart`,
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Cart"],
  endpoints: builder => ({
    getMyCart: builder.query<CartLine[], undefined>({
      query: () => "",
      transformResponse: (response: CartLinesResponse) => response.data,
      providesTags: ["Cart"],
    }),

    addCartItem: builder.mutation<unknown, { gear: string; quantity: number }>({
      query: body => ({ url: "", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),

    updateCartItem: builder.mutation<
      unknown,
      { lineId: string; quantity: number }
    >({
      query: ({ lineId, quantity }) => ({
        url: lineId,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),

    removeCartItem: builder.mutation<unknown, string>({
      query: lineId => ({ url: lineId, method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<unknown, undefined>({
      query: () => ({ url: "clear-cart", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetMyCartQuery,
  useLazyGetMyCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApiSlice;
