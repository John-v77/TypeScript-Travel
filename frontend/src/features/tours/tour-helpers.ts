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
