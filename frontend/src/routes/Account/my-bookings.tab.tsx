import { formatPrice } from "../../features/tours/tour-helpers";
import AccountPanel from "./account-panel.component";

const mockBookings = [
  {
    id: "b1",
    tourName: "The Forest Hiker",
    image: "tour-1-cover.jpg",
    date: "2026-11-12",
    participants: 2,
    price: 794,
    status: "upcoming",
  },
  {
    id: "b2",
    tourName: "The Sea Explorer",
    image: "tour-2-cover.jpg",
    date: "2026-07-04",
    participants: 1,
    price: 497,
    status: "completed",
  },
];

// TODO: bookings feature - swap mockBookings for the /users/my-bookings query.
const MyBookings = () => (
  <AccountPanel title="My bookings">
    <ul className="space-y-4">
      {mockBookings.map(booking => (
        <li
          key={booking.id}
          className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center dark:border-gray-700"
        >
          <img
            src={`/img/tours/${booking.image}`}
            alt={booking.tourName}
            loading="lazy"
            className="h-24 w-full rounded-lg object-cover sm:w-36"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {booking.tourName}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {new Date(booking.date).toLocaleDateString("en-us", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · {booking.participants}{" "}
              {booking.participants === 1 ? "person" : "people"}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
            <span className="font-bold text-gray-900 dark:text-white">
              {formatPrice(booking.price)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                booking.status === "upcoming"
                  ? "bg-w_primary-100 text-w_primary-700 dark:bg-w_primary-900 dark:text-w_primary-100"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {booking.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </AccountPanel>
);

export default MyBookings;
