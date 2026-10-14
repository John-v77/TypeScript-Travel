import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Tour } from "../../features/tours/toursApiSlice";
import { selectIsAuthenticated } from "../../features/authSlice/authStorageSlice";
import { useAppSelector } from "../../app/hooks";
import { useCreateBookingCheckoutMutation } from "../../features/bookings/bookingCheckoutApiSlice";
import { formatPrice, formatRating } from "../../features/tours/tour-helpers";

type BookingDetails = {
  checkIn: string;
  checkOut: string;
  guests: number;
  tour: Tour;
};

const TourCheckout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const bookingDetails = location.state as BookingDetails | null;

  const [
    createCheckout,
    { isLoading: isCreating, error: checkoutError, reset },
  ] = useCreateBookingCheckoutMutation();
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  // Navigating away is a side effect, so it runs in an effect rather than
  // mid-render, where StrictMode would fire it twice.
  useEffect(() => {
    if (sessionUrl) window.location.assign(sessionUrl);
  }, [sessionUrl]);

  if (!isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
            Authentication required
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Please log in to reserve this tour.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700"
            onClick={() => {
              // Back to the booking page after login - the dates live in
              // route state, which a login round trip does not keep.
              void navigate("/auth", {
                state: { from: { pathname: `/tour/${slug ?? ""}/book` } },
              });
            }}
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  if (!bookingDetails) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
            No booking details
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            We could not find the dates for this booking. Please start again.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700"
            onClick={() => {
              void navigate(`/tour/${slug ?? ""}/book`);
            }}
          >
            Start booking
          </button>
        </div>
      </main>
    );
  }

  if (sessionUrl) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
            Redirecting to Stripe
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Taking you to the secure payment page...
          </p>
        </div>
      </main>
    );
  }

  if (checkoutError) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
            Checkout could not start
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            We couldn&apos;t start the payment. Please try again.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700"
            onClick={() => {
              reset();
            }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { tour, checkIn, checkOut, guests } = bookingDetails;

  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (24 * 60 * 60 * 1000),
  );
  const partyPrice = tour.price * guests;
  // 9% of the tour price per guest - the same sums the backend charges.
  const serviceFeePerGuest = Math.round(tour.price * 0.09);
  const serviceFee = serviceFeePerGuest * guests;
  const totalPrice = partyPrice + serviceFee;

  const handlePay = async () => {
    try {
      const result = await createCheckout({
        tourId: tour.id,
        selectedDate: checkIn,
        guests,
      }).unwrap();
      setSessionUrl(result.session.url);
    } catch (error) {
      // Shown to the shopper from `checkoutError` above.
      console.error("Could not start the tour checkout:", error);
    }
  };

  return (
    <main className="flex-1 bg-white dark:bg-gray-950">
      <div className="mx-auto w-full max-w-page px-4 py-10 lg:px-8">
        <button
          type="button"
          onClick={() => {
            void navigate(-1);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition-colors hover:text-w_primary-600 dark:text-gray-400 dark:hover:text-w_primary-400"
        >
          <svg className="size-3.5 fill-current">
            <use href="/img/icons.svg#icon-arrow-left" />
          </svg>
          Back
        </button>

        <h1 className="mt-3 font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Confirm your booking
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Tour summary */}
          <div className="h-fit rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800">
            <div className="flex gap-4">
              <img
                src={`/img/tours/${tour.imageCover}`}
                alt={tour.name}
                className="size-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                  {tour.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
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
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatRating(tour.ratingsAverage)} ·&nbsp;
                    {tour.ratingsQuantity ?? 0} reviews
                  </span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>Duration: {tour.duration} days</span>
                  <span aria-hidden="true">·</span>
                  <span>Max group: {tour.maxGroupSize}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">
                    Difficulty: {tour.difficulty}
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {tour.summary}
            </p>
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                What&apos;s included
              </h3>
              <ul className="mt-2 grid gap-1.5 text-xs text-gray-600 sm:grid-cols-2 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="size-3.5 shrink-0 fill-current text-w_primary-600 dark:text-w_primary-400">
                    <use href="/img/icons.svg#icon-check" />
                  </svg>
                  Professional tour guide
                </li>
                <li className="flex items-center gap-2">
                  <svg className="size-3.5 shrink-0 fill-current text-w_primary-600 dark:text-w_primary-400">
                    <use href="/img/icons.svg#icon-check" />
                  </svg>
                  All necessary equipment
                </li>
                <li className="flex items-center gap-2">
                  <svg className="size-3.5 shrink-0 fill-current text-w_primary-600 dark:text-w_primary-400">
                    <use href="/img/icons.svg#icon-check" />
                  </svg>
                  Group photos and memories
                </li>
                <li className="flex items-center gap-2">
                  <svg className="size-3.5 shrink-0 fill-current text-w_primary-600 dark:text-w_primary-400">
                    <use href="/img/icons.svg#icon-check" />
                  </svg>
                  Safety briefing and support
                </li>
              </ul>
            </div>
          </div>

          {/* Booking + price */}
          <aside className="h-fit rounded-2xl bg-gray-50 p-5 shadow-md lg:sticky lg:top-24 dark:bg-gray-800">
            <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Booking summary
            </h2>

            <dl className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Departure</dt>
                <dd className="text-right font-medium text-gray-900 dark:text-white">
                  {new Date(checkIn).toLocaleDateString("en-us", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Return</dt>
                <dd className="text-right font-medium text-gray-900 dark:text-white">
                  {new Date(checkOut).toLocaleDateString("en-us", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Duration</dt>
                <dd className="text-right font-medium text-gray-900 dark:text-white">
                  {nights} {nights === 1 ? "night" : "nights"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Guests</dt>
                <dd className="text-right font-medium text-gray-900 dark:text-white">
                  {guests} {guests === 1 ? "guest" : "guests"}
                </dd>
              </div>
            </dl>

            <dl className="mt-5 space-y-2.5 border-t border-gray-200 pt-4 text-xs dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>
                  {formatPrice(tour.price)} x {guests}&nbsp;
                  {guests === 1 ? "guest" : "guests"}
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
              <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <dt>Total</dt>
                <dd>{formatPrice(totalPrice)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => {
                void handlePay();
              }}
              disabled={isCreating}
              className="mt-5 w-full rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <svg className="size-3.5 fill-current">
                <use href="/img/icons.svg#icon-lock" />
              </svg>
              Secure payment powered by Stripe
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default TourCheckout;
