import type { TourReview } from "../../features/reviews/reviewsApiSlice";

const ReviewCard = ({ review }: { review: TourReview }) => (
  <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
    <div className="flex items-center gap-3">
      <img
        src={`/img/users/${review.user.photo}`}
        alt={review.user.name}
        loading="lazy"
        className="size-12 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900 dark:text-white">
          {review.user.name}
        </p>
        {review.createdAt && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(review.createdAt).toLocaleDateString("en-us", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>

    <span
      className="mt-4 flex gap-0.5"
      aria-label={`${String(review.rating)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`size-3.5 fill-current ${
            review.rating >= star
              ? "text-w_primary-600 dark:text-w_primary-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        >
          <use href="/img/icons.svg#icon-star-filled" />
        </svg>
      ))}
    </span>

    <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {review.review}
    </p>
  </article>
);

export default ReviewCard;
