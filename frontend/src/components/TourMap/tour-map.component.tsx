import { useEffect, useState } from "react";
import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Location } from "../../features/tours/toursApiSlice";
import {
  fetchDrivingRoute,
  formatDistance,
  formatDuration,
  type DrivingRoute,
} from "../../utils/directions";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

type TourMapProps = {
  locations: Location[];
};

const TourMap = ({ locations }: TourMapProps) => {
  const [selected, setSelected] = useState<Location | null>(null);
  const [mapReady, setMapReady] = useState(false);


  // The road route through the stops, once Mapbox has returned one.
 
  const [road, setRoad] = useState<DrivingRoute | null>(null);

  useEffect(() => {
    if (!mapboxToken || locations.length < 2) return;

    // Aborted on unmount and whenever the stops change, so a slow reply for a
    // previous tour cannot paint its route over the current one.
    const controller = new AbortController();

    const waypoints = [...locations]
      .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
      .map(location => location.coordinates);

    void (async () => {
      try {
        setRoad(
          await fetchDrivingRoute(waypoints, mapboxToken, controller.signal),
        );
      } catch (error) {
        // The straight-line fallback is already correct; a failed lookup is
        // not worth interrupting the page for.
        if (!controller.signal.aborted) {
          console.error("Could not load the tour's road route:", error);
        }
        setRoad(null);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [locations]);

  if (!mapboxToken) {
    return (
      <p
        role="alert"
        className="px-4 py-20 text-center text-gray-500 dark:text-gray-400"
      >
        The map needs a Mapbox token. Add a public token as&nbsp;
        <code className="font-mono">VITE_MAPBOX_TOKEN</code> in&nbsp;
        <code className="font-mono">frontend/.env</code> and restart the dev
        server.
      </p>
    );
  }

  if (!locations.length) {
    return (
      <p className="px-4 py-20 text-center text-gray-500 dark:text-gray-400">
        No locations available for this tour.
      </p>
    );
  }

  // Trip order: the seed data numbers each stop with `day`.
  const ordered = [...locations].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  const singlePoint = locations.length === 1;
  const [lng, lat] = locations[0].coordinates;
  const lngs = locations.map(location => location.coordinates[0]);
  const lats = locations.map(location => location.coordinates[1]);

  const route = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: road
        ? road.coordinates
        : ordered.map(location => location.coordinates),
    },
  };

  return (
    <div className="relative size-full">
      {/* Only for a real road route - there is no honest distance to quote
          for a straight line across an ocean. */}
      {road && mapReady && (
        <p className="pointer-events-none absolute top-3 left-3 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-200">
          {formatDistance(road.distanceMeters)} ·&nbsp;
          {formatDuration(road.durationSeconds)} driving
        </p>
      )}

      <MapGL
        mapboxAccessToken={mapboxToken}
        initialViewState={
          singlePoint
            ? { longitude: lng, latitude: lat, zoom: 9 }
            : {
                bounds: [
                  [Math.min(...lngs), Math.min(...lats)],
                  [Math.max(...lngs), Math.max(...lats)],
                ],
                fitBoundsOptions: { padding: 100 },
              }
        }
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/standard"
        onLoad={event => {
          event.target.setConfigProperty("basemap", "theme", "monochrome");
        }}
        // `idle` rather than `load`: load fires before the monochrome theme
        // has painted, which is the colour flash this hides.
        onIdle={() => {
          setMapReady(true);
        }}
        scrollZoom={false}
      >
        <NavigationControl position="top-right" />

        {ordered.length > 1 && (
          <Source id="tour-route" type="geojson" data={route}>
            <Layer
              id="tour-route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{

                "line-color": "#16a34a",
                "line-width": 3,
                ...(road ? {} : { "line-dasharray": [2, 1.5] }),
              }}
            />
          </Source>
        )}

        {ordered.map((location, index) => (
          <Marker
            key={location._id}
            longitude={location.coordinates[0]}
            latitude={location.coordinates[1]}
            anchor="bottom"
          >
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-w_primary-600 text-sm leading-none font-bold text-white shadow-lg transition-transform hover:scale-115 hover:bg-w_primary-700"
              onClick={event => {
                event.stopPropagation();
                setSelected(location);
              }}
              aria-label={`Stop ${String(index + 1)}: ${location.description}`}
            >
              {location.day ?? index + 1}
            </button>
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.coordinates[0]}
            latitude={selected.coordinates[1]}
            onClose={() => {
              setSelected(null);
            }}
            closeOnClick={false}
          >
            <span className="text-sm text-gray-900">
              {selected.day !== undefined && (
                <strong>Day {selected.day}:&nbsp;</strong>
              )}
              {selected.description}
            </span>
          </Popup>
        )}
      </MapGL>
    </div>
  );
};

export default TourMap;
