import { useGetAllToursQuery } from "../../features/tours/toursApiSlice";
import TourCard from "../../components/TourCard/tour.card.component";

const ToursPage = () => {
  const { data, error, isLoading } = useGetAllToursQuery();
  const tours = data ?? [];

  return (
    <main className="flex-1">
      {/* Page head */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
            Tours
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Handpicked adventures for people who would rather book a trip than a
            viewing.
          </p>
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
              <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {tours.length}
                </span>{" "}
                tours
              </p>

              {tours.length > 0 ? (
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {tours.map(tour => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                    No tours found
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    There are no tours to show yet.
                  </p>
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
