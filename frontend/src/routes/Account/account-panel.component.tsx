import type { ReactNode } from "react";

/** The white card every tab under /myaccount renders into, with its heading. */
const AccountPanel = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8 dark:bg-gray-800">
    <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
      {title}
    </h2>
    <div className="mt-6">{children}</div>
  </section>
);

export default AccountPanel;
