import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Tour } from "../tours/toursApiSlice";

/** One saved tour, as `/users/my-favorites` returns it (tour populated). */
export type Favorite = {
  id: string;
  tour: Tour | null;
  user: string;
};

interface FavoritesResponse {
  status: string;
  data: Favorite[];
}

export const favoritesApiSlice = createApi({
  reducerPath: "favoritesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/api/v1/users/my-favorites",
    prepareHeaders: (headers, { getState }) => {
      const { token } = (
        getState() as { authStorage: { token: string | null } }
      ).authStorage;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Favorites"],
  endpoints: builder => ({
    getMyFavorites: builder.query<Favorite[], void>({
      query: () => "",
      transformResponse: (response: FavoritesResponse) => response.data,
      providesTags: ["Favorites"],
    }),
    addFavorite: builder.mutation<void, string>({
      query: tourId => ({ url: "", method: "POST", body: { tour: tourId } }),
      invalidatesTags: ["Favorites"],
    }),
    // Takes the favourite's own id, not the tour's.
    removeFavorite: builder.mutation<void, string>({
      query: favoriteId => ({ url: favoriteId, method: "DELETE" }),
      invalidatesTags: ["Favorites"],
    }),
  }),
});

export const {
  useGetMyFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApiSlice;
