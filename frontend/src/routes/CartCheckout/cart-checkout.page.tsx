import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import {
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
} from "../../features/cartSlice/cartSlice";
import { selectIsAuthenticated } from "../../features/authSlice/authStorageSlice";
import { useCreateGearCheckoutMutation } from "../../features/gear/gearCheckoutApiSlice";

const CartCheckout = () => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartItemCount = useAppSelector(selectCartItemCount);

  const [createCheckout, { isLoading: isCreating, error: checkoutError }] =
    useCreateGearCheckoutMutation();

  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  // Navigating away is a side effect, so it runs in an effect rather than
  // mid-render, where StrictMode would fire it twice.
  useEffect(() => {
    if (sessionUrl) window.location.assign(sessionUrl);
  }, [sessionUrl]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
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

  // Going straight to the URL, or coming back after a completed order - the
  // cart is emptied once the payment is confirmed.
  if (cartItems.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
            Nothing to check out
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Your cart is empty.
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

  const handlePay = async () => {
    try {
      const result = await createCheckout({
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
        })),
      }).unwrap();

      setSessionUrl(result.session.url);
    } catch (error) {
      console.error("Could not start the gear checkout:", error);
    }
  };

  return (
    <main className="flex-1">
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-page px-4 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            {cartItemCount} item{cartItemCount === 1 ? "" : "s"}&nbsp;·&nbsp;
            {cartTotal.toLocaleString("en-us", {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto grid w-full max-w-page gap-8 px-4 lg:grid-cols-[2fr_1fr] lg:px-8">
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
              Payment
            </h2>

            <p className="mt-4 text-gray-600 dark:text-gray-400">
              You&apos;ll be taken to Stripe&apos;s secure checkout to enter
              your card and billing details. Your order is recorded here first,
              so it can be matched to the payment when you come back.
            </p>

            {checkoutError && (
              <p
                role="alert"
                className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                We couldn&apos;t start the payment. Please try again.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                void handlePay();
              }}
              disabled={isCreating}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-w_primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <svg className="size-4 animate-spin fill-current">
                  <use href="/img/icons.svg#icon-loader" />
                </svg>
              ) : (
                <svg className="size-4 fill-current">
                  <use href="/img/icons.svg#icon-lock" />
                </svg>
              )}
              {isCreating
                ? "Starting payment..."
                : `Pay ${cartTotal.toLocaleString("en-us", {
                    style: "currency",
                    currency: "USD",
                  })}`}
            </button>

            <p className="mt-auto pt-6 text-xs text-gray-500 dark:text-gray-400">
              Payment is handled by Stripe. This site never sees your card
              details.
            </p>
          </div>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-md lg:sticky lg:top-24 dark:bg-gray-800">
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
              Order summary
            </h2>

            <ul className="mt-6 space-y-4">
              {cartItems.map(item => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {(item.price * item.quantity).toLocaleString("en-us", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Subtotal</dt>
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

            <Link
              to="/cart"
              className="mt-6 block text-center text-sm font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
            >
              Back to cart
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CartCheckout;
