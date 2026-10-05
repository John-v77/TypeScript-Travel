import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type GearOrderItem = {
  gear: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type GearOrder = {
  _id: string;
  user: string;
  items: GearOrderItem[];
  totalPrice: number;
  stripeSessionId: string;
  paid: boolean;
  createdAt: string;
  paidAt?: string;
};

type GearCheckoutResponse = {
  status: string;
  session: { id: string; url: string };
  data: GearOrder;
};

type GearOrderResponse = {
  status: string;
  data: GearOrder;
};

type GearOrdersResponse = {
  status: string;
  results: number;
  data: GearOrder[];
};

export const gearCheckoutApiSlice = createApi({
  reducerPath: "gearCheckoutApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/api/v1/gear",
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["GearOrders"],
  endpoints: builder => ({
    createGearCheckout: builder.mutation<
      GearCheckoutResponse,
      { items: { id: string; quantity: number }[] }
    >({
      query: body => ({ url: "checkout-session", method: "POST", body }),
      invalidatesTags: ["GearOrders"],
    }),

    confirmGearOrder: builder.mutation<GearOrder, string>({
      query: sessionId => ({
        url: `orders/confirm/${sessionId}`,
        method: "POST",
      }),
      transformResponse: (response: GearOrderResponse) => response.data,
      invalidatesTags: ["GearOrders"],
    }),

    getMyGearOrders: builder.query<GearOrder[], undefined>({
      query: () => `my-orders`,
      transformResponse: (response: GearOrdersResponse) => response.data,
      providesTags: ["GearOrders"],
    }),
  }),
});

export const {
  useCreateGearCheckoutMutation,
  useConfirmGearOrderMutation,
  useGetMyGearOrdersQuery,
} = gearCheckoutApiSlice;
