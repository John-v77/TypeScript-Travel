import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetTourByIdQuery } from "../../features/tours/toursApiSlice";
import { formatPrice, formatRating } from "../../features/tours/tour-helpers";
import { useFavorites } from "../../features/favorites/useFavorites";
import { outlineButton } from "../Home/home.styles";


const Placeholder = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full min-h-40 items-center justify-center border-2 border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
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
  const { signedIn, isFavorite, toggle } = useFavorites();
  const saved = tour ? isFavorite(tour.id) : false;

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
      <div className="mx-auto w-full max-w-page">
        <section className="relative isolate flex min-h-[24rem] items-end overflow-hidden sm:min-h-[28rem]">
          <img
            src={`/img/tours/${tour.imageCover}`}
            alt={tour.name}
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-gray-950/85 via-gray-950/35 to-transparent" />

          <div className="flex w-full flex-col gap-8 px-8 pt-24 pb-10 text-white sm:px-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
                <span className="flex items-center gap-2">
                  <svg className="size-4 fill-current">
                    <use href="/img/icons.svg#icon-clock" />
                  </svg>
                  {tour.duration} days
                </span>
                <span className="flex items-center gap-2">
                  <svg className="size-4 fill-current">
                    <use href="/img/icons.svg#icon-map-pin" />
                  </svg>
                  {tour.startLocation.description}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="size-4 fill-current">
                    <use href="/img/icons.svg#icon-star" />
                  </svg>
                  {formatRating(tour.ratingsAverage)} (
                  {tour.ratingsQuantity ?? 0} reviews)
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-light sm:text-5xl">
                {tour.name}
              </h1>
              <p className="mt-3 text-base text-white/90 sm:text-lg">
                {tour.summary}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-end gap-4">
              <div className="border border-white/80 px-3 py-1.5 text-center leading-tight">
                <div className="text-[0.6rem] tracking-widest uppercase">
                  From
                </div>
                <div className="text-xl font-light">
                  {formatPrice(tour.price)}
                </div>
                <div className="text-[0.6rem] tracking-widest uppercase">
                  per person
                </div>
              </div>

              <Link
                to={`/tour/${tour.id}/book`}
                className="inline-flex items-center justify-center gap-2 bg-w_primary-600 px-7 py-3 text-sm font-semibold tracking-widest text-white uppercase outline-2 outline-offset-2 outline-w_primary-600 transition-colors hover:bg-w_primary-700 hover:outline-w_primary-700"
              >
                Book this tour
                <svg className="size-4 fill-current">
                  <use href="/img/icons.svg#icon-arrow-right" />
                </svg>
              </Link>

              {signedIn && (
                <button
                  type="button"
                  onClick={() => {
                    toggle(tour.id);
                  }}
                  aria-pressed={saved}
                  aria-label={
                    saved
                      ? `Remove ${tour.name} from favourites`
                      : `Save ${tour.name} to favourites`
                  }
                  className={outlineButton}
                >
                  <svg className="size-4 fill-current">
                    <use href="/img/icons.svg#icon-heart" />
                  </svg>
                  {saved ? "Saved" : "Save"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col bg-[#F7F7F7] px-8 py-16 text-gray-900 sm:px-16 lg:py-20 dark:bg-linear-to-br dark:from-gray-900 dark:via-gray-900 dark:to-[#1c3324] dark:text-white">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#24472f] uppercase dark:text-[#a9c47a]">
              About the tour
            </p>
            <h2 className="mt-3 text-2xl font-light sm:text-3xl">
              About {tour.name}
            </h2>
            {tour.description.split("\n").map(paragraph => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-4 text-[0.95rem] leading-relaxed text-gray-700 dark:text-gray-300"
              >
                {paragraph}
              </p>
            ))}

            <div className="mt-auto pt-10" />
            <div className="grid grid-cols-2 gap-6 border-t border-[#24472f]/15 pt-8 dark:border-white/10">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 size-5 fill-current text-[#24472f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-calendar" />
                </svg>
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-[#24472f] uppercase dark:text-[#a9c47a]">
                    Next date
                  </p>
                  <p className="mt-1 text-lg font-light">
                    {tour.startDates[0]
                      ? new Date(tour.startDates[0].date).toLocaleString(
                          "en-us",
                          {
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "Dates to be announced"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 size-5 fill-current text-[#24472f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-users" />
                </svg>
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-[#24472f] uppercase dark:text-[#a9c47a]">
                    Participants
                  </p>
                  <p className="mt-1 text-lg font-light">
                    {tour.maxGroupSize} people
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-linear-to-br from-[#4a86c5] to-[#2f5783] px-8 py-16 text-white sm:px-16 lg:px-12 lg:py-20">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#d6e6f5] uppercase">
              Your tour guides
            </p>
            <h2 className="mt-3 text-2xl font-light sm:text-3xl">
              Led by people who know the way
            </h2>
            <ul className="mt-10 space-y-5">
              {tour.guides.map(guide => (
                <li key={guide._id} className="flex items-center gap-4">
                  <img
                    src={`/img/users/${guide.photo}`}
                    alt={guide.name}
                    loading="lazy"
                    className="size-14 rounded-full border-2 border-white/70 object-cover"
                  />
                  <div>
                    <p className="text-lg font-light">{guide.name}</p>
                    <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-[#d6e6f5] uppercase">
                      {guide.role === "lead-guide"
                        ? "Lead guide"
                        : "Tour guide"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10" />
            <div className="grid grid-cols-2 gap-6 border-t border-white/20 pt-8">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 size-5 fill-current text-[#d6e6f5]">
                  <use href="/img/icons.svg#icon-trending-up" />
                </svg>
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-[#d6e6f5] uppercase">
                    Difficulty
                  </p>
                  <p className="mt-1 text-lg font-light capitalize">
                    {tour.difficulty}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 size-5 fill-current text-[#d6e6f5]">
                  <use href="/img/icons.svg#icon-star" />
                </svg>
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-[#d6e6f5] uppercase">
                    Rating
                  </p>
                  <p className="mt-1 text-lg font-light">
                    {formatRating(tour.ratingsAverage)} / 5
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Gallery"
          className="grid gap-1 bg-white py-1 sm:grid-cols-3 sm:grid-rows-2 dark:bg-gray-950"
        >
          {tour.images.map((image, index) => (
            <figure
              key={image}
              className={`group relative isolate overflow-hidden ${
                index === 0
                  ? "h-80 sm:col-span-2 sm:row-span-2 sm:h-[34rem]"
                  : "h-64 sm:h-auto"
              }`}
            >
              <img
                src={`/img/tours/${image}`}
                alt={`${tour.name}, picture ${String(index + 1)}`}
                loading="lazy"
                className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-gray-950/60 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 scale-95 border border-white/70 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
              />
              <figcaption className="absolute bottom-6 left-6 flex items-baseline gap-3 text-white">
                <span className="text-3xl font-light">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[0.6rem] font-semibold tracking-[0.25em] text-white/85 uppercase">
                  / {String(tour.images.length).padStart(2, "0")}
                </span>
              </figcaption>
            </figure>
          ))}
        </section>

        {/* Map */}
        <section className="pt-20">
          <div className="px-8 text-center sm:px-16">
            <p className="text-xs font-semibold tracking-[0.25em] text-w_primary-600 uppercase dark:text-w_primary-400">
              The route
            </p>
            <h2 className="mt-3 text-3xl font-light text-gray-900 sm:text-4xl dark:text-white">
              Where you are going
            </h2>
          </div>
          {/* TODO: map feature (Mapbox) - keeps this height. */}
          <div className="mt-12 h-[32rem]">
            <Placeholder>Route map coming soon</Placeholder>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-20">
          <div className="px-8 text-center sm:px-16">
            <p className="text-xs font-semibold tracking-[0.25em] text-w_primary-600 uppercase dark:text-w_primary-400">
              Reviews
            </p>
            <h2 className="mt-3 text-3xl font-light text-gray-900 sm:text-4xl dark:text-white">
              What travellers say
            </h2>
          </div>
          {/* TODO: reviews feature - list, plus "Write a review" for people who
            booked this tour. */}
          <div className="mt-12">
            <Placeholder>Reviews coming soon</Placeholder>
          </div>
        </section>

        {/* Call to action - a light grey split, photo right. The bottom margin
          keeps it off the footer. */}
        <section className="mb-16 grid lg:mb-20 lg:grid-cols-2">
          <img
            src={`/img/tours/${tour.images[2] ?? tour.imageCover}`}
            alt=""
            loading="lazy"
            className="h-80 w-full object-cover lg:order-2 lg:h-full lg:min-h-[30rem]"
          />
          <div className="flex flex-col justify-center bg-[#F7F7F7] px-8 py-16 text-gray-900 sm:px-16 dark:bg-linear-to-br dark:from-gray-900 dark:to-emerald-950 dark:text-white">
            <p className="text-xs font-semibold tracking-[0.25em] text-w_primary-700 uppercase dark:text-w_primary-400">
              Book online
            </p>
            <h2 className="mt-3 text-3xl font-light sm:text-4xl">
              What are you waiting for?
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {tour.duration} days. 1 adventure. Infinite memories. Make it
              yours today!
            </p>

            <Link
              to={`/tour/${tour.id}/book`}
              className="mt-10 inline-flex w-fit items-center justify-center gap-2 border border-w_primary-700 px-7 py-3 text-sm font-semibold tracking-widest text-w_primary-700 uppercase transition-colors hover:bg-w_primary-700 hover:text-white dark:border-w_primary-400 dark:text-w_primary-400 dark:hover:bg-w_primary-400 dark:hover:text-gray-950"
            >
              Book tour now!
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TourDetails;
