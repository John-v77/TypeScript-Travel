import { useState, type ChangeEvent, type SubmitEventHandler } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { useLoginMutation } from "../../features/authSlice/authApiSlice";
import { loginSuccess } from "../../features/authSlice/authStorageSlice";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // My account sends people here with the page they wanted in `state.from`.
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [login, { isLoading, error, isSuccess, data }] = useLoginMutation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    try {
      const result = await login(formData).unwrap();
      dispatch(loginSuccess({ user: result.data.user, token: result.token }));
      void navigate(redirectTo);
    } catch (err) {
      // The mutation's error state shows the message above the form.
      console.error("Login error:", err);
    }
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    void submit();
  };

  if (isSuccess) {
    const user = data.data.user;

    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-20 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md dark:bg-gray-800">
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Login successful
          </h1>
          <div className="mt-6 flex items-center gap-4">
            <img
              src={`/img/users/${user.photo ?? "Default.jpg"}`}
              alt={user.name}
              className="size-16 rounded-full object-cover ring-2 ring-w_primary-600"
            />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Welcome back, {user.name}!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-20 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="text-center font-serif text-2xl font-bold text-gray-900 dark:text-white">
          Login
        </h1>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            Login failed. Check your email and password, then try again.
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
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="Enter your email"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-w_primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link
            to="/forgot-password"
            className="font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
          >
            Forgot password?
          </Link>
          <p className="text-gray-600 dark:text-gray-400">
            Need an account?&nbsp;&nbsp;
            <Link
              to="/register"
              className="font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
