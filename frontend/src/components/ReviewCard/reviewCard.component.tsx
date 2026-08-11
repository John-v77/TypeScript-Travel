export type Review = {
  _id: string;
  review: string;
  rating: number;
  user: {
    _id: string;
    name: string;
    photo: string;
  };
};

const ReviewCard = ({ review }: { review: Review }) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`reviews__star reviews__star--${review.rating >= i + 1 ? "active" : "inactive"}`}
      >
        <use xlinkHref="/img/icons.svg#icon-star"></use>
      </svg>
    ));
  };

  return (
    <div className="reviews__card">
      <div className="reviews__avatar">
        <img
          className="reviews__avatar-img"
          src={`/img/users/${review.user.photo}`}
          alt={review.user.name}
        />
        <h6 className="reviews__user">{review.user.name}</h6>
      </div>
      <p className="reviews__text">{review.review}</p>
      <div className="reviews__rating">{renderStars()}</div>
    </div>
  );
};

export default ReviewCard;
