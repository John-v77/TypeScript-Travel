export const dropdownClass = [
  // Turn on the stylable list
  "[appearance:base-select] [&::picker(select)]:[appearance:base-select]",
  // The list box
  "[&::picker(select)]:mt-1 [&::picker(select)]:rounded-lg [&::picker(select)]:p-1 [&::picker(select)]:shadow-lg",
  "[&::picker(select)]:border [&::picker(select)]:border-gray-200 [&::picker(select)]:bg-white",
  "dark:[&::picker(select)]:border-gray-600 dark:[&::picker(select)]:bg-gray-700",
  // Each option
  "[&_option]:rounded-md [&_option]:px-3 [&_option]:py-2",
  "[&_option:hover]:bg-gray-100 dark:[&_option:hover]:bg-gray-600",
  // The selected option
  "[&_option:checked]:bg-w_primary-50 [&_option:checked]:text-w_primary-700",
  "dark:[&_option:checked]:bg-gray-600 dark:[&_option:checked]:text-white",
].join(" ");

export const selectBase = [
  "flex items-center justify-between px-4",
  "rounded-lg border border-gray-300 bg-white text-sm text-gray-900",
  "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
  "transition-colors focus:border-w_primary-500 focus:outline-none",
  dropdownClass,
].join(" ");
