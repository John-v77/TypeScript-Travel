import { useAppSelector } from "../../app/hooks";
import { selectUser } from "../../features/authSlice/authStorageSlice";
import AccountPanel from "./account-panel.component";

const Settings = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="space-y-8">
      <AccountPanel title="Your account settings">
        <form className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={user?.name}
              autoComplete="name"
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
              defaultValue={user?.email}
              autoComplete="email"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <SaveButton label="Save settings" />
        </form>
      </AccountPanel>

      <AccountPanel title="Password change">
        <form className="space-y-5">
          <div>
            <label
              htmlFor="passwordCurrent"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Current password
            </label>
            <input
              type="password"
              id="passwordCurrent"
              name="passwordCurrent"
              autoComplete="current-password"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              New password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              minLength={8}
              autoComplete="new-password"
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
              minLength={8}
              autoComplete="new-password"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-w_primary-500 focus:ring-2 focus:ring-w_primary-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <SaveButton label="Save password" />
        </form>
      </AccountPanel>
    </div>
  );
};

const SaveButton = ({ label }: { label: string }) => (
  <button
    type="submit"
    disabled
    title="Coming soon"
    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-w_primary-600 px-5 py-2.5 text-sm font-semibold text-white opacity-50"
  >
    {label}
  </button>
);

export default Settings;
