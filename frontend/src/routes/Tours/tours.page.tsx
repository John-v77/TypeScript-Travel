import { useMemo, useState } from "react";
import { useGetAllToursQuery } from "../../features/tours/toursApiSlice";
import TourCard from "../../components/TourCard/tour.card.component";
import {
  difficultyOptions,
  durationOptions,
  filterTours,
  hasActiveFilters,
  locationOptions,
  noTourFilters,
  priceOptions,
  sortOptions,
  type TourFilters,
} from "../../features/tours/tour-helpers";
import { sortItems } from "../../utils/sort-items";
import { selectBase } from "./tours.styles";

const ToursPage = () => {
  const { data, error, isLoading } = useGetAllToursQuery();

  const [filters, setFilters] = useState<TourFilters>(noTourFilters);
  const [sortBy, setSortBy] = useState("featured");

  const tours = useMemo(() => data ?? [], [data]);

  const visibleTours = useMemo(
    () => sortItems(filterTours(tours, filters), sortBy),
    [tours, filters, sortBy],
  );

  const locations = useMemo(() => locationOptions(tours), [tours]);

  const filtering = hasActiveFilters(filters);

  /** Reads the four selects into the filter list. */
  const applyFilters = (filterForm: HTMLFormElement) => {
    const form = new FormData(filterForm);
    setFilters({
      location: String(form.get("location") ?? ""),
      difficulty: String(form.get("difficulty") ?? ""),
      duration: String(form.get("duration") ?? ""),
      price: String(form.get("price") ?? ""),
    });
  };

  return (
    <main className="flex-1">
      {/* Page head + filter bar */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
            Tours
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Handpicked adventures for people who would rather book a trip than a
            viewing.
          </p>
          <form
            id="tour-filters"
            onChange={event => {
              applyFilters(event.currentTarget);
            }}
            onSubmit={event => {
              event.preventDefault();
              applyFilters(event.currentTarget);
            }}
            onReset={() => {
              setFilters(noTourFilters);
            }}
            className="mt-8 grid gap-4 rounded-xl bg-white p-6 shadow-md sm:grid-cols-2 lg:grid-cols-5 dark:bg-gray-800"
          >
            <div>
              <label
                htmlFor="tour-filter-location"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Location
              </label>
              <select
                id="tour-filter-location"
                className={`${selectBase} w-full py-2.5`}
                name="location"
                defaultValue=""
              >
                <option value="">Any Location</option>
                {locations.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tour-filter-difficulty"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Difficulty
              </label>
              <select
                id="tour-filter-difficulty"
                className={`${selectBase} w-full py-2.5 capitalize`}
                name="difficulty"
                defaultValue=""
              >
                <option value="">Any Difficulty</option>
                {difficultyOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tour-filter-duration"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Duration
              </label>
              <select
                id="tour-filter-duration"
                className={`${selectBase} w-full py-2.5`}
                name="duration"
                defaultValue=""
              >
                <option value="">Any Duration</option>
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tour-filter-price"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Price Range
              </label>
              <select
                id="tour-filter-price"
                className={`${selectBase} w-full py-2.5`}
                name="price"
                defaultValue=""
              >
                <option value="">Any Price</option>
                {priceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-w_primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700"
              >
                Apply Filters
              </button>
              {/* Disabled when there is nothing to clear */}
              <button
                type="reset"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-w_primary-600 hover:text-w_primary-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:border-w_primary-400 dark:hover:text-w_primary-400"
                disabled={!filtering}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          {isLoading && <ToursSkeleton />}

          {!isLoading && error && (
            <div className="rounded-xl border border-gray-200 py-16 text-center dark:border-gray-800">
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Could not load tours
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                The tours service did not answer. Please try again later.
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filtering ? (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {visibleTours.length}
                      </span>{" "}
                      of {tours.length} tours
                    </>
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {tours.length}
                      </span>{" "}
                      tours
                    </>
                  )}
                  {filtering && (
                    <button
                      type="reset"
                      className="ml-3 text-sm font-semibold text-w_primary-600 underline underline-offset-2 hover:text-w_primary-700 dark:text-w_primary-400"
                      form="tour-filters"
                    >
                      Clear filters
                    </button>
                  )}
                </p>

                <select
                  className={`${selectBase} w-auto py-2`}
                  aria-label="Sort tours"
                  value={sortBy}
                  onChange={event => {
                    setSortBy(event.target.value);
                  }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      Sort by: {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {visibleTours.length > 0 ? (
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTours.map(tour => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                    No tours found
                  </h3>
                  <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400">
                    {tours.length === 0
                      ? "There are no tours to show yet."
                      : "Nothing matches those filters. Try widening one of them."}
                  </p>
                  {filtering && (
                    <button
                      type="reset"
                      className="rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700"
                      form="tour-filters"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

/** Card-shaped placeholders, so the grid does not jump when the data lands. */
const ToursSkeleton = () => (
  <>
    <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
      Loading tours...
    </p>
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800"
        >
          <div className="aspect-4/3 animate-pulse bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  </>
);

export default ToursPage;
