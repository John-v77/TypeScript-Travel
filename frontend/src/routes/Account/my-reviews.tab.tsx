import AccountPanel from "./account-panel.component";

const mockReviews = [
  {
    id: "r1",
    tourName: "The Sea Explorer",
    rating: 5,
    review:
      "Every day was better than the last. The guides knew every cove and the food was fantastic.",
    date: "2026-07-12",
  },
  {
    id: "r2",
    tourName: "The Snow Adventurer",
    rating: 4,
    review: "Hard going on day three, but the views made up for it.",
    date: "2026-02-20",
  },
];

// TODO: reviews feature - swap mockReviews for the user's reviews query.
const MyReviews = () => (
  <AccountPanel title="My reviews">
    <ul className="space-y-4">
      {mockReviews.map(review => (
        <li
          key={review.id}
          className="rounded-xl border border-gray-200 p-5 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {review.tourName}
            </h3>
            <span
              className="flex gap-0.5"
              aria-label={`${String(review.rating)} out of 5`}
            >
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`size-4 fill-current ${
                    star <= review.rating
                      ? "text-w_primary-600 dark:text-w_primary-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  <use href="/img/icons.svg#icon-star" />
                </svg>
              ))}
            </span>
          </div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {review.review}
          </p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {new Date(review.date).toLocaleDateString("en-us", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </li>
      ))}
    </ul>
  </AccountPanel>
);

export default MyReviews;
