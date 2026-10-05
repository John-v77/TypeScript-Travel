import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectUser } from "../../features/authSlice/authStorageSlice";

const MyAccount = () => {
  const user = useAppSelector(selectUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex shrink-0 items-center gap-3 rounded-lg bg-w_primary-600 px-4 py-3 text-sm font-medium whitespace-nowrap text-white transition-colors"
      : "flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";

  return (
    <main className="flex-1 bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto grid w-full max-w-page gap-8 px-4 lg:grid-cols-[16rem_1fr] lg:px-8">
        <nav className="h-fit rounded-2xl bg-white p-6 shadow-md lg:sticky lg:top-24 dark:bg-gray-800">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-6 dark:border-gray-700">
            <img
              src={`/img/users/${user.photo ?? "Default.jpg"}`}
              alt={user.name}
              className="size-14 rounded-full object-cover ring-2 ring-w_primary-500"
            />
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                My account
              </h1>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </p>
            </div>
          </div>

          {/* Scrolls sideways rather than wrapping on narrow screens. */}
          <ul className="mt-6 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            <li>
              <NavLink to="/myaccount/settings" className={tabClass}>
                <svg className="size-5 shrink-0 fill-current">
                  <use href="/img/icons.svg#icon-settings" />
                </svg>
                Settings
              </NavLink>
            </li>
            <li>
              <NavLink to="/myaccount/my-bookings" className={tabClass}>
                <svg className="size-5 shrink-0 fill-current">
                  <use href="/img/icons.svg#icon-calendar" />
                </svg>
                My bookings
              </NavLink>
            </li>
            <li>
              <NavLink to="/myaccount/my-favorites" className={tabClass}>
                <svg className="size-5 shrink-0 fill-current">
                  <use href="/img/icons.svg#icon-heart" />
                </svg>
                My favorites
              </NavLink>
            </li>
            <li>
              <NavLink to="/myaccount/my-reviews" className={tabClass}>
                <svg className="size-5 shrink-0 fill-current">
                  <use href="/img/icons.svg#icon-star" />
                </svg>
                My reviews
              </NavLink>
            </li>
            <li>
              <NavLink to="/myaccount/billing" className={tabClass}>
                <svg className="size-5 shrink-0 fill-current">
                  <use href="/img/icons.svg#icon-credit-card" />
                </svg>
                Billing
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default MyAccount;
