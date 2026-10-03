/** The fields `sortItems` reads. Tours have them; gear items can too. */
type SortableItem = {
  price: number;
  ratingsAverage?: number;
  ratingsQuantity?: number;
};

/**
 * Returns a new array - never sorts the caller's list in place
 */
export const sortItems = <T extends SortableItem>(list: T[], sortBy: string) =>
  [...list].sort((a, b) => {
    const ratingA = a.ratingsAverage ?? 0;
    const ratingB = b.ratingsAverage ?? 0;

    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating-high":
        return ratingB - ratingA;
      case "rating-low":
        return ratingA - ratingB;
      default:
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.ratingsQuantity ?? 0) - (a.ratingsQuantity ?? 0);
    }
  });
