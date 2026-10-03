import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetTourByIdQuery } from "../../features/tours/toursApiSlice";
import { formatRating } from "../../features/tours/tour-helpers";

const Fact = ({
  label,
  value,
  icon,
  capitalize = false,
}: {
  label: string;
  value: string;
  icon: string;
  capitalize?: boolean;
}) => (
  <div className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700">
    <svg className="size-5 fill-current text-w_primary-600 dark:text-w_primary-400">
      <use href={`/img/icons.svg#icon-${icon}`} />
    </svg>
    <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    <span
      className={`ml-auto text-gray-900 dark:text-white ${
        capitalize ? "capitalize" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

/** A dashed box standing in for a feature that is not built yet. */
const Placeholder = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
    {children}
  </div>
);

const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: tour,
    error,
    isLoading,
  } = useGetTourByIdQuery(id ?? "", { skip: !id });

  if (isLoading) {
    return (
      <main className="flex-1 bg-white py-20 text-center dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">
          Loading tour details...
        </p>
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="flex-1 bg-white py-20 text-center dark:bg-gray-950">
        <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
          Tour not found
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          We could not load that tour. It may have been removed.
        </p>
        <Link
          to="/tours"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700"
        >
          Back to all tours
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={`/img/tours/${tour.imageCover}`}
          alt={tour.name}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-w_primary-900/85 to-gray-950/80" />

        <div className="mx-auto flex min-h-[26rem] w-full max-w-page flex-col justify-end px-4 py-16 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-white sm:text-5xl">
            {tour.name}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-white">
            <span className="flex items-center gap-2">
              <svg className="size-5 fill-current">
                <use href="/img/icons.svg#icon-clock" />
              </svg>
              {tour.duration} days
            </span>
            <span className="flex items-center gap-2">
              <svg className="size-5 fill-current">
                <use href="/img/icons.svg#icon-map-pin" />
              </svg>
              {tour.startLocation.description}
            </span>
            <span className="flex items-center gap-2">
              <svg className="size-5 fill-current">
                <use href="/img/icons.svg#icon-star" />
              </svg>
              {formatRating(tour.ratingsAverage)} ({tour.ratingsQuantity ?? 0}{" "}
              reviews)
            </span>
          </div>
        </div>
      </section>

      {/* Facts, guides and description */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto grid w-full max-w-page gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div className="space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Quick facts
              </h2>
              <div className="mt-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
                <Fact
                  label="Next date"
                  value={
                    tour.startDates[0]
                      ? new Date(tour.startDates[0].date).toLocaleString(
                          "en-us",
                          { month: "long", year: "numeric" },
                        )
                      : "Dates to be announced"
                  }
                  icon="calendar"
                />
                <Fact
                  label="Difficulty"
                  value={tour.difficulty}
                  icon="trending-up"
                  capitalize
                />
                <Fact
                  label="Participants"
                  value={`${String(tour.maxGroupSize)} people`}
                  icon="users"
                />
                <Fact
                  label="Rating"
                  value={`${formatRating(tour.ratingsAverage)} / 5`}
                  icon="star"
                />
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Your tour guides
              </h2>
              <div className="mt-4">
                {/* TODO: guides feature - names, photos and roles. */}
                <Placeholder>Tour guides coming soon</Placeholder>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
              About {tour.name}
            </h2>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              {tour.summary}
            </p>
            {tour.description.split("\n").map(paragraph => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-4 text-gray-600 dark:text-gray-400"
              >
                {paragraph}
              </p>
            ))}

            {/* The closing call to action is a long way down this page, so the
                decision can also be made right after reading the tour. */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={`/tour/${tour.id}/book`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-w_primary-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-w_primary-700"
              >
                Book this tour
                <svg className="size-5 fill-current">
                  <use href="/img/icons.svg#icon-arrow-right" />
                </svg>
              </Link>
              {/* TODO: favourites feature - "Save" button goes here. */}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20">
        <div className="mx-auto grid w-full max-w-page gap-4 px-4 sm:grid-cols-3 lg:px-8">
          {tour.images.map((image, index) => (
            <img
              key={image}
              src={`/img/tours/${image}`}
              alt={`${tour.name}, picture ${String(index + 1)}`}
              loading="lazy"
              className="h-64 w-full rounded-2xl object-cover shadow-md"
            />
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Where you are going
          </h2>
          {/* TODO: map feature (Mapbox or similar) - keeps this height. */}
          <div className="mt-6 h-[32rem]">
            <Placeholder>Route map coming soon</Placeholder>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Reviews
          </h2>
          <div className="mt-6">
            {/* TODO: reviews feature - list, plus "Write a review" for people
                who booked this tour. */}
            <Placeholder>Reviews coming soon</Placeholder>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-w_primary-700 py-20">
        <div className="mx-auto grid w-full max-w-page items-center gap-10 px-4 lg:grid-cols-2 lg:px-8">
          <div className="grid grid-cols-2 gap-4">
            <img
              src={`/img/tours/${tour.images[1]}`}
              alt=""
              loading="lazy"
              className="h-48 w-full rounded-2xl object-cover shadow-lg"
            />
            <img
              src={`/img/tours/${tour.images[2]}`}
              alt=""
              loading="lazy"
              className="h-48 w-full rounded-2xl object-cover shadow-lg"
            />
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold text-white">
              What are you waiting for?
            </h2>
            <p className="mt-4 text-w_primary-50">
              {tour.duration} days. 1 adventure. Infinite memories. Make it
              yours today!
            </p>

            <div className="mt-8">
              <Link
                to={`/tour/${tour.id}/book`}
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-w_primary-700 transition-colors hover:bg-w_primary-50"
              >
                Book tour now!
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default TourDetails;
