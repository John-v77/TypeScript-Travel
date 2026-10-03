import type { Tour } from "./toursApiSlice";

/** `5.0`, `4.8` - ratings always print one decimal place. */
export const formatRating = (value: number | undefined) =>
  typeof value === "number" ? value.toFixed(1) : "—";

/** `$1,497` - prices are whole dollars everywhere in this app. */
export const formatPrice = (value: number) =>
  value.toLocaleString("en-us", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/* --------------------------------------------------------------------------
   Filter-bar options
   -------------------------------------------------------------------------- */

export const difficultyOptions = ["easy", "medium", "difficult"];

export const durationOptions = [
  { value: "1-5", label: "1 - 5 days" },
  { value: "6-10", label: "6 - 10 days" },
  { value: "11+", label: "11+ days" },
];

export const priceOptions = [
  { value: "0-500", label: "Under $500" },
  { value: "500-1000", label: "$500 - $1,000" },
  { value: "1000-2000", label: "$1,000 - $2,000" },
  { value: "2000+", label: "$2,000+" },
];

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating-high", label: "Rating: High to Low" },
  { value: "rating-low", label: "Rating: Low to High" },
];

/** The start locations actually present in the data, de-duplicated. */
export const locationOptions = (list: Tour[]) =>
  [
    ...new Set(
      list.map(tour => tour.startLocation.description).filter(Boolean),
    ),
  ].sort();

/* --------------------------------------------------------------------------
   Filtering and sorting
   -------------------------------------------------------------------------- */

export type TourFilters = {
  location: string;
  difficulty: string;
  duration: string;
  price: string;
};

export const noTourFilters: TourFilters = {
  location: "",
  difficulty: "",
  duration: "",
  price: "",
};

export const hasActiveFilters = (filters: TourFilters) =>
  Object.values(filters).some(value => value !== "");

const matchesDuration = (range: string, duration: number) => {
  if (range === "1-5") return duration >= 1 && duration <= 5;
  if (range === "6-10") return duration >= 6 && duration <= 10;
  if (range === "11+") return duration >= 11;
  return true;
};

const matchesPrice = (range: string, price: number) => {
  if (range === "0-500") return price < 500;
  if (range === "500-1000") return price >= 500 && price < 1000;
  if (range === "1000-2000") return price >= 1000 && price < 2000;
  if (range === "2000+") return price >= 2000;
  return true;
};

export const filterTours = (list: Tour[], filters: TourFilters) =>
  list.filter(
    tour =>
      (filters.location === "" ||
        tour.startLocation.description === filters.location) &&
      (filters.difficulty === "" || tour.difficulty === filters.difficulty) &&
      (filters.duration === "" ||
        matchesDuration(filters.duration, tour.duration)) &&
      (filters.price === "" || matchesPrice(filters.price, tour.price)),
  );
