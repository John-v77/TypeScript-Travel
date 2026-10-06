import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type BookingCheckoutResponse = {
  status: string;
  session: { id: string; url: string };
};

export const bookingCheckoutApiSlice = createApi({
  reducerPath: "bookingCheckoutApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/api/v1/bookings",
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: builder => ({
    createBookingCheckout: builder.mutation<
      BookingCheckoutResponse,
      { tourId: string; selectedDate: string; guests: number }
    >({
      query: ({ tourId, selectedDate, guests }) => ({
        url: `checkout-session/${tourId}`,
        method: "POST",
        body: { selectedDate, guests },
      }),
    }),
  }),
});

export const { useCreateBookingCheckoutMutation } = bookingCheckoutApiSlice;
