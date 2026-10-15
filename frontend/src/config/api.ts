export const apiUrl = (
  import.meta.env.DEV
    ? import.meta.env.VITE_API_URL_LOCAL
    : import.meta.env.VITE_API_URL
) as string;
