import { useAppSelector } from "../../app/hooks";
import { selectUser } from "../authSlice/authStorageSlice";
import {
  useAddFavoriteMutation,
  useGetMyFavoritesQuery,
  useRemoveFavoriteMutation,
} from "./favoritesApiSlice";

export const useFavorites = () => {
  const signedIn = useAppSelector(selectUser) !== null;
  const { data: favorites = [] } = useGetMyFavoritesQuery(undefined, {
    skip: !signedIn,
  });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  /** The saved entry for a tour, if this user saved it. */
  const findFavorite = (tourId: string) =>
    favorites.find(favorite => favorite.tour?.id === tourId);

  const isFavorite = (tourId: string) =>
    signedIn && findFavorite(tourId) !== undefined;

  const toggle = (tourId: string) => {
    const saved = findFavorite(tourId);
    void (saved ? removeFavorite(saved.id) : addFavorite(tourId));
  };

  return { signedIn, isFavorite, toggle };
};
