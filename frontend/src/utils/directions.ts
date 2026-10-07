/**
 * Road routing, via Mapbox's Directions API.
 *
 * Asks Mapbox to snap the tour's stops to roads and returns the polyline it
 * gives back. A plain fetch rather than an RTK Query endpoint: a one-shot
 * lookup against a third party with no tags to invalidate. It runs on the same
 * public token the maps use.
 */

/** Mapbox refuses more than 25 coordinates in one Directions request. */
const maxWaypoints = 25;

const endpoint = "https://api.mapbox.com/directions/v5/mapbox/driving";

export type DrivingRoute = {
  /** [lng, lat] pairs following the road, ready to hand to a LineString. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
};

type DirectionsResponse = {
  code?: string;
  routes?: {
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: [number, number][] };
  }[];
};

/**
 * The driving route through every waypoint, in order.
 *
 * Returns null - rather than throwing - when there is simply no road route
 * between the stops. That is a normal answer, not a failure: several tours
 * hop between islands or continents, and the caller falls back to drawing
 * straight lines for those.
 *
 * Throws only when the request itself fails, so a caller can tell "these
 * places aren't connected by road" apart from "the lookup is down".
 */
export const fetchDrivingRoute = async (
  waypoints: [number, number][],
  token: string,
  signal?: AbortSignal,
): Promise<DrivingRoute | null> => {
  // A route needs two ends. One stop is a place, not a journey.
  if (waypoints.length < 2) return null;

  // Rather than silently routing through the first 25 and drawing a line that
  // stops halfway, leave it to the straight-line fallback.
  if (waypoints.length > maxWaypoints) return null;

  const path = waypoints
    .map(([lng, lat]) => `${String(lng)},${String(lat)}`)
    .join(";");

  const url =
    `${endpoint}/${path}` +
    `?geometries=geojson&overview=full` +
    `&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Directions failed with status ${String(response.status)}`);
  }

  const body = (await response.json()) as DirectionsResponse;

  // "NoRoute" is Mapbox's own answer for unconnected points - the usual case
  // being stops separated by water.
  if (body.code !== "Ok") return null;

  const routes = body.routes ?? [];
  if (routes.length === 0) return null;

  const best = routes[0];
  const coordinates = best.geometry?.coordinates ?? [];

  if (coordinates.length === 0) return null;

  return {
    coordinates,
    distanceMeters: best.distance ?? 0,
    durationSeconds: best.duration ?? 0,
  };
};


export const formatDistance = (metres: number): string =>
  `${Math.round(metres / 1609.344).toLocaleString("en-us")} mi`;


export const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${String(minutes)}m`;
  return `${String(hours)}h ${String(minutes)}m`;
};
