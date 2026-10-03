import { Link } from "react-router-dom";
import type { Tour } from "../../features/tours/toursApiSlice";
import { formatPrice, formatRating } from "../../features/tours/tour-helpers";
import { useFavorites } from "../../features/favorites/useFavorites";

type TourCardProps = {
  tour: Tour;
};

const TourCard = ({ tour }: TourCardProps) => {
  const { signedIn, isFavorite, toggle } = useFavorites();
  const saved = isFavorite(tour.id);

  return (
    <Link
      to={`/tour/${tour.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-xl dark:bg-gray-800"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={`/img/tours/${tour.imageCover}`}
          alt={tour.name}
          loading="lazy"
          className="size-full object-cover"
        />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="inline-block rounded-full bg-w_primary-600 px-3 py-1 text-xs font-semibold text-white capitalize">
            {tour.difficulty}
          </span>
          <span className="inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
            {tour.duration}-day
          </span>
        </div>

        {/* Stays light in dark mode - it sits on the photograph, not the card. */}
        <div className="absolute bottom-4 left-4">
          <span className="inline-block rounded-lg bg-white/95 px-3 py-1.5 text-base font-bold text-gray-900 shadow-lg backdrop-blur-sm">
            {formatPrice(tour.price)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 transition-colors group-hover:text-w_primary-600 dark:text-white dark:group-hover:text-w_primary-400">
              {tour.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <svg className="size-4 shrink-0 fill-current">
                <use href="/img/icons.svg#icon-map-pin" />
              </svg>
              {tour.startLocation.description}
            </p>
          </div>

          {signedIn && (
            <button
              type="button"
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                toggle(tour.id);
              }}
              aria-pressed={saved}
              aria-label={
                saved
                  ? `Remove ${tour.name} from favourites`
                  : `Save ${tour.name} to favourites`
              }
              className={`-m-1.5 shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                saved
                  ? "text-w_primary-600 dark:text-w_primary-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-6 fill-current">
                <use href="/img/icons.svg#icon-heart" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <svg className="size-4 shrink-0 fill-current">
              <use href="/img/icons.svg#icon-clock" />
            </svg>
            <span>{tour.duration} days</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <svg className="size-4 shrink-0 fill-current">
              <use href="/img/icons.svg#icon-users" />
            </svg>
            <span>{tour.maxGroupSize} people</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <svg className="size-4 shrink-0 fill-current">
              <use href="/img/icons.svg#icon-star" />
            </svg>
            <span>
              {formatRating(tour.ratingsAverage)} ({tour.ratingsQuantity ?? 0})
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 italic dark:text-gray-400">
          {tour.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="size-4 shrink-0 fill-current">
              <use href="/img/icons.svg#icon-calendar" />
            </svg>
            {tour.startDates[0]
              ? new Date(tour.startDates[0].date).toLocaleString("en-us", {
                  month: "long",
                  year: "numeric",
                })
              : "Dates to be announced"}
          </span>
          <span>per person</span>
        </div>
      </div>
    </Link>
  );
};

export default TourCard;
