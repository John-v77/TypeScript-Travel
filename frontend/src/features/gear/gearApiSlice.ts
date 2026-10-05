import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Gear = {
  _id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: "jacket" | "backpack" | "skis" | "goggles";
};

type GearResponse = {
  status: string;
  results: number;
  data: Gear[];
};

export const gearApiSlice = createApi({
  reducerPath: "gearApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:3000/api/v1" }),
  tagTypes: ["Gear"],
  endpoints: builder => ({
    getAllGear: builder.query<Gear[], undefined>({
      query: () => `gear`,
      transformResponse: (response: GearResponse) => response.data,
      providesTags: [{ type: "Gear", id: "LIST" }],
    }),
  }),
});

export const { useGetAllGearQuery } = gearApiSlice;
