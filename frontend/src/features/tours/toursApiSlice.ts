import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Location = {
  _id: string;
  description: string;
  type: string;
  coordinates: [number, number];
  day?: number;
};

type StartLocation = {
  description: string;
  type: string;
  coordinates: [number, number];
  address: string;
};

export type TourStartDate = {
  _id: string;
  id: string;
  date: string;
  participants: number;
  soldOut: boolean;
};

export type Tour = {
  // The backend's toJSON transform renames Mongo's _id to id and strips it.
  id: string;
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  price: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  startDates: TourStartDate[];
  startLocation: StartLocation;
  locations?: Location[];
  guides: string[];
  ratingsAverage: number;
  ratingsQuantity?: number;
  slug?: string;
};

interface TourResponse {
  status: string;
  data: Tour;
}

interface ToursResponse {
  status: string;
  results: number;
  data: Record<string, Tour>;
}

export const toursApiSlice = createApi({
  reducerPath: "toursApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:3000/api/v1" }),
  tagTypes: ["Tours"],
  endpoints: builder => ({
    getAllTours: builder.query<Tour[], void>({
      query: () => `tours`,
      transformResponse: (response: ToursResponse) =>
        Object.values(response.data),
      providesTags: [{ type: "Tours", id: "LIST" }],
    }),
    getTourById: builder.query<Tour, string>({
      query: id => `tours/${id}`,
      transformResponse: (response: TourResponse) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Tours", id }],
    }),
  }),
});

export const { useGetAllToursQuery, useGetTourByIdQuery } = toursApiSlice;
