import { formatPrice } from "../../features/tours/tour-helpers";
import AccountPanel from "./account-panel.component";

const mockInvoices = [
  {
    id: "INV-1042",
    description: "The Forest Hiker - 2 people",
    date: "2026-09-28",
    amount: 794,
    status: "paid",
  },
  {
    id: "INV-0987",
    description: "The Sea Explorer - 1 person",
    date: "2026-06-01",
    amount: 497,
    status: "paid",
  },
];

// TODO: billing feature - swap mockInvoices for the billing history query.
const Billing = () => (
  <AccountPanel title="Billing">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs tracking-wide text-gray-500 uppercase dark:border-gray-700 dark:text-gray-400">
          <tr>
            <th className="py-3 pr-4 font-semibold">Invoice</th>
            <th className="py-3 pr-4 font-semibold">Description</th>
            <th className="py-3 pr-4 font-semibold">Date</th>
            <th className="py-3 pr-4 text-right font-semibold">Amount</th>
            <th className="py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-gray-700 dark:text-gray-300">
          {mockInvoices.map(invoice => (
            <tr key={invoice.id}>
              <td className="py-3 pr-4 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                {invoice.id}
              </td>
              <td className="py-3 pr-4">{invoice.description}</td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {new Date(invoice.date).toLocaleDateString("en-us", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap">
                {formatPrice(invoice.amount)}
              </td>
              <td className="py-3">
                <span className="rounded-full bg-w_primary-100 px-3 py-1 text-xs font-semibold text-w_primary-700 capitalize dark:bg-w_primary-900 dark:text-w_primary-100">
                  {invoice.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </AccountPanel>
);

export default Billing;
