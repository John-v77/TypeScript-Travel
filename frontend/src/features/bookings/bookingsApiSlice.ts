import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** A booking as /users/my-bookings returns it, with the tour populated. */
export type MyBooking = {
  _id: string;
  tour: { id: string; name: string } | null;
  price: number;
  selectedDate: string;
  paid: boolean;
};

type MyBookingsResponse = {
  status: string;
  results: number;
  data: MyBooking[];
};

export const bookingsApiSlice = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/api/v1/users",
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: builder => ({
    getMyBookings: builder.query<MyBooking[], undefined>({
      query: () => "my-bookings",
      transformResponse: (response: MyBookingsResponse) => response.data,
    }),
  }),
});

export const { useGetMyBookingsQuery } = bookingsApiSlice;
