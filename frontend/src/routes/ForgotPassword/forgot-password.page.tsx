import { useState, type SubmitEventHandler } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/authSlice/authApiSlice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [forgotPassword, { isLoading, error, isSuccess }] =
    useForgotPasswordMutation();

  const submit = async () => {
    try {
      await forgotPassword({ email }).unwrap();
    } catch (err) {
      // The mutation's error state shows the message above the form.
      console.error("Forgot password error:", err);
    }
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    void submit();
  };

  if (isSuccess) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-20 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md dark:bg-gray-800">
          <div className="text-center">
            <svg className="mx-auto size-12 fill-current text-w_primary-600 dark:text-w_primary-400">
              <use href="/img/icons.svg#icon-check-circle" />
            </svg>
            <h1 className="mt-4 font-serif text-2xl font-bold text-gray-900 dark:text-white">
              Reset link sent
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Check <span className="font-medium">{email}</span> for
              instructions on how to reset your password.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-block text-sm font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-20 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            Failed to send the reset link. Check the address and try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
              }}
              required
              autoComplete="email"
              placeholder="Enter your email address"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-w_primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/auth"
            className="font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
          >
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;
