import { useState } from "react";
import { useGetAllGearQuery } from "../../features/gear/gearApiSlice";
import { useAppDispatch } from "../../app/hooks";
import { addToCart } from "../../features/cartSlice/cartSlice";

/** `all` first, then one per category, in the order the shop reads best. */
const categories = [
  { value: "all", label: "All Gear" },
  { value: "jacket", label: "Jackets" },
  { value: "backpack", label: "Backpacks" },
  { value: "skis", label: "Skis" },
  { value: "goggles", label: "Goggles" },
];

const GearPage = () => {
  const dispatch = useAppDispatch();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const {
    data: gearItems = [],
    isLoading,
    isError,
  } = useGetAllGearQuery(undefined);

  const filteredItems = gearItems.filter(
    item => selectedCategory === "all" || item.category === selectedCategory,
  );

  return (
    <main className="flex-1">
      {/* Page head + category pills - only four categories, so a row of
          toggles beats a select. */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
            Adventure Gear
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Essential equipment for your outdoor adventures.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map(category => {
              const active = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedCategory(category.value);
                  }}
                  className={
                    active
                      ? "rounded-full bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                      : "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:text-w_primary-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-w_primary-400"
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          {isLoading && (
            <div className="flex justify-center py-16">
              <svg className="size-8 animate-spin fill-current text-w_primary-600">
                <use href="/img/icons.svg#icon-loader" />
              </svg>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="rounded-xl border border-gray-200 py-16 text-center dark:border-gray-800"
            >
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Could not load gear
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                The shop did not answer. Please try again later.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredItems.length}
              </span>{" "}
              {filteredItems.length === 1 ? "item" : "items"}
            </p>
          )}

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <article
                key={item._id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                {/* `shrink-0` stops the card's flex column from squeezing the
                    photo when a neighbour's description runs longer. */}
                <div className="h-64 shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>

                  {/* `mt-auto` lands the price and button on one line across
                      the row, however long each description is. */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.price.toLocaleString("en-us", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(
                          addToCart({
                            id: item._id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            description: item.description,
                            category: item.category,
                            quantity: 1,
                          }),
                        );
                      }}
                      className="rounded-lg bg-w_primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-w_primary-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default GearPage;
