import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTourBySlugQuery } from "../../features/tours/toursApiSlice";
import { formatPrice, formatRating } from "../../features/tours/tour-helpers";

const BookTour = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    data: tour,
    error,
    isLoading,
  } = useGetTourBySlugQuery(slug ?? "", { skip: !slug });

  const [departure, setDeparture] = useState("");
  const [guests, setGuests] = useState(1);

  if (isLoading) {
    return (
      <main className="flex-1 bg-white py-20 text-center dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="flex-1 bg-white py-20 text-center dark:bg-gray-950">
        <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
          Tour not found
        </h1>
      </main>
    );
  }

  const departures = [...tour.startDates]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(startDate => ({
      value: new Date(startDate.date).toISOString(),
      label: new Date(startDate.date).toLocaleDateString("en-us", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      seatsLeft: Math.max(tour.maxGroupSize - startDate.participants, 0),
      soldOut: startDate.soldOut || startDate.participants >= tour.maxGroupSize,
    }));
  const bookable = departures.filter(option => !option.soldOut);

  const maxGuests =
    departures.find(option => option.value === departure)?.seatsLeft ??
    tour.maxGroupSize;

  // The tour runs on fixed dates, so the return is the departure plus the
  // tour's own duration.
  const returnDate = departure
    ? new Date(
        new Date(departure).getTime() + tour.duration * 24 * 60 * 60 * 1000,
      ).toISOString()
    : "";

  const partyPrice = tour.price * guests;
  // 9% of the tour price per guest - the same sums the backend charges.
  const serviceFeePerGuest = Math.round(tour.price * 0.09);
  const serviceFee = serviceFeePerGuest * guests;
  const totalPrice = partyPrice + serviceFee;

  const handleReserve = () => {
    void navigate(`/checkout/${tour.slug}`, {
      state: { checkIn: departure, checkOut: returnDate, guests, tour },
    });
  };

  return (
    <main className="flex-1 bg-white dark:bg-gray-950">
      <div className="mx-auto w-full max-w-page px-4 py-8 lg:px-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          {tour.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map(star => (
              <svg
                key={star}
                className={`size-3 fill-current ${
                  tour.ratingsAverage >= star
                    ? "text-w_primary-600 dark:text-w_primary-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                <use href="/img/icons.svg#icon-star-filled" />
              </svg>
            ))}
          </span>
          <span>
            {formatRating(tour.ratingsAverage)} · {tour.ratingsQuantity ?? 0}
            &nbsp;reviews
          </span>
          <span aria-hidden="true">·</span>
          <span>{tour.startLocation.description}</span>
          <span aria-hidden="true">·</span>
          <span>{tour.duration} days</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{tour.difficulty}</span>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            {/* Gallery: the cover large, the last photo of the set as a
                framed card over its bottom-right corner. */}
            <div className="relative pr-6 pb-10 sm:pr-10">
              <img
                src={`/img/tours/${tour.imageCover}`}
                alt={tour.name}
                className="h-64 w-full rounded-2xl object-cover shadow-md sm:h-80"
              />
              <img
                src={`/img/tours/${tour.images[tour.images.length - 1] ?? tour.imageCover}`}
                alt={`${tour.name}, another view`}
                loading="lazy"
                className="absolute right-0 bottom-0 h-32 w-48 rounded-xl border-4 border-white object-cover shadow-xl sm:h-40 sm:w-60 dark:border-gray-950"
              />
            </div>

            {/* Detail */}
            <div className="mt-6">
              <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                Tour hosted by Voyara
              </h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Up to {tour.maxGroupSize} guests
              </p>

              <div className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-800">
                <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">
                  About this tour experience
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {tour.summary}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Join us for an unforgettable adventure through&nbsp;
                  {tour.startLocation.description}. This {tour.duration}-day
                  tour offers breathtaking views, expert guidance, and memories
                  that will last a lifetime. Perfect for {tour.difficulty} level
                  adventurers looking for an authentic outdoor experience.
                </p>
              </div>
            </div>
          </div>

          {/* Reservation card */}
          <aside className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-200 lg:sticky lg:top-24 dark:bg-gray-800 dark:ring-gray-700">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(tour.price)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                per person
              </span>
            </div>

            {/* A departure, not a free date range. The tour runs on fixed
                dates and the booking is checked against them server-side. */}
            <div className="mt-4">
              <label
                htmlFor="departure"
                className="mb-1 block text-[0.65rem] font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
              >
                Departure
              </label>
              <select
                id="departure"
                value={departure}
                onChange={e => {
                  const value = e.target.value;
                  setDeparture(value);
                  const seatsLeft = departures.find(
                    option => option.value === value,
                  )?.seatsLeft;
                  if (seatsLeft !== undefined) {
                    setGuests(current => Math.min(current, seatsLeft));
                  }
                }}
                disabled={departures.length === 0}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-w_primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {departures.length === 0
                    ? "No dates announced yet"
                    : "Choose a date"}
                </option>
                {departures.map(option => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.soldOut}
                  >
                    {option.label}
                    {option.soldOut ? " - sold out" : ""}
                  </option>
                ))}
              </select>

              {departure && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Returns&nbsp;
                  {new Date(returnDate).toLocaleDateString("en-us", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}

              {departures.length > 0 && bookable.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                  Every departure for this tour is sold out.
                </p>
              )}
            </div>

            <div className="mt-3">
              <label
                htmlFor="guests"
                className="mb-1 block text-[0.65rem] font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
              >
                Guests
              </label>
              <select
                id="guests"
                value={guests}
                onChange={e => {
                  setGuests(Number(e.target.value));
                }}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-w_primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: Math.max(maxGuests, 1) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} guest{i === 0 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleReserve}
              disabled={!departure}
              className="mt-5 w-full rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reserve
            </button>
            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
              You won&apos;t be charged yet
            </p>

            <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-xs dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>
                  {formatPrice(tour.price)} x {guests} guest
                  {guests === 1 ? "" : "s"}
                </dt>
                <dd>{formatPrice(partyPrice)}</dd>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>
                  Service fee {formatPrice(serviceFeePerGuest)} x {guests}&nbsp;
                  {guests === 1 ? "guest" : "guests"}
                </dt>
                <dd>{formatPrice(serviceFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <dt>Total</dt>
                <dd>{formatPrice(totalPrice)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default BookTour;
