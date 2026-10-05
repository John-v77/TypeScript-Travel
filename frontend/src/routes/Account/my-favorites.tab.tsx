import { Link } from "react-router-dom";
import TourCard from "../../components/TourCard/tour.card.component";
import { useGetMyFavoritesQuery } from "../../features/favorites/favoritesApiSlice";
import AccountPanel from "./account-panel.component";

/**
 * Saved tours, from the favorites endpoint. Two columns rather than the
 * listing's three - the panel is narrower than a full page band.
 */
const MyFavorites = () => {
  const { data: favorites = [], isLoading } = useGetMyFavoritesQuery();
  // A saved tour that was later deleted comes back as `tour: null`.
  const tours = favorites.flatMap(favorite =>
    favorite.tour ? [favorite.tour] : [],
  );

  return (
    <AccountPanel title="My favorites">
      {isLoading && (
        <p className="text-gray-600 dark:text-gray-400">
          Loading your saved tours...
        </p>
      )}

      {!isLoading && tours.length === 0 && (
        <div className="py-8 text-center">
          <svg className="mx-auto mb-4 size-10 fill-current text-gray-300 dark:text-gray-600">
            <use href="/img/icons.svg#icon-heart" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            You haven&apos;t saved any tours yet.
          </p>
          <Link
            to="/tours"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700"
          >
            Browse tours
          </Link>
        </div>
      )}

      {tours.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {tours.map(tour => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </AccountPanel>
  );
};

export default MyFavorites;
