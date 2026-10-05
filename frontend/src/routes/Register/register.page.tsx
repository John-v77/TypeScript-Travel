import { useState, type ChangeEvent, type SubmitEventHandler } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { useSignupMutation } from "../../features/authSlice/authApiSlice";
import { loginSuccess } from "../../features/authSlice/authStorageSlice";

/**
 * Create an account. Same card and states as the login page; signing up
 * signs the new account in, so success is a greeting.
 */
const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [signup, { isLoading, error, isSuccess, data }] = useSignupMutation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    try {
      const result = await signup(formData).unwrap();
      dispatch(loginSuccess({ user: result.data.user, token: result.token }));
      void navigate("/");
    } catch (err) {
      // The mutation's error state shows the message above the form.
      console.error("Registration error:", err);
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
            Registration successful
          </h1>
          <div className="mt-6 flex items-center gap-4">
            <img
              src={`/img/users/${user.photo ?? "Default.jpg"}`}
              alt={user.name}
              className="size-16 rounded-full object-cover ring-2 ring-w_primary-600"
            />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Welcome, {user.name}!
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
          Create account
        </h1>
      

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            Registration failed. Check your details and try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Enter your full name"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm password
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-w_primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-w_primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?&nbsp;&nbsp;
          <Link
            to="/auth"
            className="font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
