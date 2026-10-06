import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type TourReview = {
  _id: string;
  review: string;
  rating: number;
  createdAt?: string;
  user: {
    _id: string;
    name: string;
    photo: string;
  };
};

type TourReviewsResponse = {
  status: string;
  results: number;
  data: TourReview[];
};

export type CreateReviewArgs = {
  tourId: string;
  review: string;
  rating: number;
};


export const reviewsApiSlice = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Reviews"],
  endpoints: builder => ({
    getTourReviews: builder.query<TourReview[], string>({
      query: tourId => `tours/${tourId}/reviews`,
      transformResponse: (response: TourReviewsResponse) => response.data,
      providesTags: (_result, _error, tourId) => [
        { type: "Reviews", id: tourId },
      ],
    }),
    createReview: builder.mutation<{ status: string }, CreateReviewArgs>({
      query: ({ tourId, review, rating }) => ({
        url: `tours/${tourId}/reviews`,
        method: "POST",
        body: { review, rating },
      }),
      invalidatesTags: (_result, _error, { tourId }) => [
        { type: "Reviews", id: tourId },
      ],
    }),
  }),
});

export const { useGetTourReviewsQuery, useCreateReviewMutation } =
  reviewsApiSlice;
