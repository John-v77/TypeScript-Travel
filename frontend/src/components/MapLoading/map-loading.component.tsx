/**
 * Covers a map until it has painted. Mapbox draws its default colours before
 * the monochrome theme lands, so the map is hidden until it reports idle.
 */
const MapLoading = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <svg
      className="size-8 animate-spin fill-current text-w_primary-600"
      aria-label="Loading map"
    >
      <use href="/img/icons.svg#icon-loader" />
    </svg>
  </div>
);

export default MapLoading;
