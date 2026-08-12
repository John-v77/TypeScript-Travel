import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

type Location = {
  _id: string
  description: string
  type: string
  coordinates: [number, number]
  day?: number
}

type StartLocation = {
  description: string
  type: string
  coordinates: [number, number]
  address: string
}

export type Tour = {
  _id: string
  name: string
  duration: number
  maxGroupSize: number
  difficulty: string
  price: number
  summary: string
  description: string
  imageCover: string
  images: string[]
  startDates: string[]
  startLocation: StartLocation
  locations: Location[]
  guides: string[]
  ratingsAverage: number
  ratingsQuantity: number
  slug?: string
}

interface ToursResponse {
  status: string
  results: number
  data: Record<string, Tour>
}

export const toursApiSlice = createApi({
  reducerPath: "toursApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:3000/api/v1" }),
  tagTypes: ["Tours"],
  endpoints: builder => ({
    getAllTours: builder.query<Tour[], void>({
      query: () => `tours`,
      transformResponse: (response: ToursResponse) => Object.values(response.data),
      providesTags: [{ type: "Tours", id: "LIST" }],
    }),
  }),
})

export const { useGetAllToursQuery } = toursApiSlice
