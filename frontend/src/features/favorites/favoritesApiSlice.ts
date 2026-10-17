import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Tour } from "../tours/toursApiSlice";
import { apiUrl } from "../../config/api";

/** One saved tour, as `/users/my-favorites` returns it (tour populated). */
export type Favorite = {
  id: string;
  tour: Tour | null;
  user: string;
};

type FavoritesResponse = {
  status: string;
  data: Favorite[];
};

export const favoritesApiSlice = createApi({
  reducerPath: "favoritesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/users/my-favorites`,
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
    getMyFavorites: builder.query<Favorite[], undefined>({
      query: () => "",
      transformResponse: (response: FavoritesResponse) => response.data,
      providesTags: ["Favorites"],
    }),
    addFavorite: builder.mutation<undefined, string>({
      query: tourId => ({ url: "", method: "POST", body: { tour: tourId } }),
      invalidatesTags: ["Favorites"],
    }),
    // Takes the favourite's own id, not the tour's.
    removeFavorite: builder.mutation<undefined, string>({
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
