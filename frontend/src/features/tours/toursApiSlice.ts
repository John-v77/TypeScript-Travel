import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiUrl } from "../../config/api";

export type Location = {
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

export type TourGuide = {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: string;
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
  guides: TourGuide[];
  ratingsAverage: number;
  ratingsQuantity?: number;
  slug: string;
};

type TourResponse = {
  status: string;
  data: Tour;
};

type ToursResponse = {
  status: string;
  results: number;
  data: Record<string, Tour>;
};

export const toursApiSlice = createApi({
  reducerPath: "toursApi",
  baseQuery: fetchBaseQuery({ baseUrl: apiUrl }),
  tagTypes: ["Tours"],
  endpoints: builder => ({
    getAllTours: builder.query<Tour[], undefined>({
      query: () => `tours`,
      transformResponse: (response: ToursResponse) =>
        Object.values(response.data),
      providesTags: [{ type: "Tours", id: "LIST" }],
    }),

    getTourBySlug: builder.query<Tour, string>({
      query: slug => `tours/${slug}`,
      transformResponse: (response: TourResponse) => response.data,
      providesTags: (_result, _error, slug) => [{ type: "Tours", id: slug }],
    }),
  }),
});

export const { useGetAllToursQuery, useGetTourBySlugQuery } = toursApiSlice;
