import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
  updateQuantity,
} from "../../features/cartSlice/cartSlice";
import { selectIsAuthenticated } from "../../features/authSlice/authStorageSlice";

/**
 * The cart.
 *
 * Page head on the tinted band, then the lines on the left and the summary on
 * the right. The summary sticks as the list scrolls, so the total and the
 * checkout button stay reachable however long the cart gets.
 */
const Cart = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  /**
   * Checkout needs an account. Someone signed out is sent to the login page
   * with where they were headed, so logging in drops them straight into
   * checkout rather than back on the home page.
   */
  const handleCheckout = () => {
    if (isAuthenticated) {
      void navigate("/cart/checkout");
    } else {
      void navigate("/auth", {
        state: { from: { pathname: "/cart/checkout" } },
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="text-center">
          <svg className="mx-auto size-12 fill-current text-gray-400 dark:text-gray-600">
            <use href="/img/icons.svg#icon-shopping-cart" />
          </svg>
          <h1 className="mt-6 font-serif text-3xl font-bold text-gray-900 dark:text-white">
            Your cart is empty
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Nothing in here yet. The gear shop is a good place to start.
          </p>
          <Link
            to="/gear"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-w_primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
            Your cart
          </h1>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto grid w-full max-w-page gap-8 px-4 lg:grid-cols-[2fr_1fr] lg:px-8">
          {/* Lines */}
          <ul className="space-y-4">
            {cartItems.map(item => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-md sm:flex-nowrap dark:bg-gray-800"
              >
                <div className="size-24 shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-500">
                    {item.category}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* At one, minus removes the line - the reducer treats a
                      quantity of 0 as a removal. */}
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:border-w_primary-600 hover:text-w_primary-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-w_primary-400 dark:hover:text-w_primary-400"
                    onClick={() => {
                      dispatch(
                        updateQuantity({
                          id: item.id,
                          quantity: item.quantity - 1,
                        }),
                      );
                    }}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <svg className="size-4 fill-current">
                      <use href="/img/icons.svg#icon-minus" />
                    </svg>
                  </button>
                  <span
                    className="w-8 text-center font-semibold text-gray-900 dark:text-white"
                    aria-label={`Quantity of ${item.name}`}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:border-w_primary-600 hover:text-w_primary-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-w_primary-400 dark:hover:text-w_primary-400"
                    onClick={() => {
                      dispatch(
                        updateQuantity({
                          id: item.id,
                          quantity: item.quantity + 1,
                        }),
                      );
                    }}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <svg className="size-4 fill-current">
                      <use href="/img/icons.svg#icon-plus" />
                    </svg>
                  </button>
                </div>

                <div className="w-24 text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {(item.price * item.quantity).toLocaleString("en-us", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.price.toLocaleString("en-us", {
                        style: "currency",
                        currency: "USD",
                      })}
                      &nbsp;each
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  onClick={() => {
                    dispatch(removeFromCart(item.id));
                  }}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <svg className="size-5 fill-current">
                    <use href="/img/icons.svg#icon-trash" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="h-fit rounded-2xl bg-gray-50 p-6 shadow-md lg:sticky lg:top-24 dark:bg-gray-800">
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
              Order summary
            </h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Subtotal ({cartItemCount} items)</dt>
                <dd>
                  {cartTotal.toLocaleString("en-us", {
                    style: "currency",
                    currency: "USD",
                  })}
                </dd>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Shipping</dt>
                <dd>Free</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <dt>Total</dt>
                <dd>
                  {cartTotal.toLocaleString("en-us", {
                    style: "currency",
                    currency: "USD",
                  })}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-6 w-full rounded-lg bg-w_primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700"
            >
              Proceed to checkout
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Link
                to="/gear"
                className="font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={() => {
                  dispatch(clearCart());
                }}
                className="text-gray-500 underline underline-offset-2 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                Clear cart
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default Cart;
