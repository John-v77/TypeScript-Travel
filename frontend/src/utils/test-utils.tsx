import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren, ReactElement } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import type { AppStore, RootState } from "../app/store";
import { makeStore } from "../app/store";

type ExtendedRenderOptions = Omit<RenderOptions, "queries"> & {
  /** Initial Redux state, e.g. a signed-in user or a cart. */
  preloadedState?: Partial<RootState>;

  /** A specific store instead of a fresh `makeStore(preloadedState)`. */
  store?: AppStore;

  /**
   * The URL to render at, e.g. "/tour/abc123".
   *
   * Pages that read useParams need a router that actually matched a route -
   * BrowserRouter alone gives them undefined params. Supplying this swaps in a
   * MemoryRouter, so no navigation touches the jsdom URL and tests cannot leak
   * location state into one another.
   */
  route?: string;

  /**
   * The route pattern `route` should match, e.g. "/tour/:id". Defaults to
   * matching everything, which is enough for pages that read no params.
   */
  path?: string;

  /**
   * Router location state, as `navigate(to, { state })` would supply - the
   * tour checkout reads its whole booking from it.
   */
  state?: unknown;
};

/**
 * Renders `ui` inside the Redux Provider and a router, with a fresh store.
 * Returns the store, a userEvent instance and all of RTL's queries.
 */
export const renderWithProviders = (
  ui: ReactElement,
  extendedRenderOptions: ExtendedRenderOptions = {},
) => {
  const {
    preloadedState = {},
    store = makeStore(preloadedState),
    route,
    path = "*",
    state,
    ...renderOptions
  } = extendedRenderOptions;

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      {route === undefined ? (
        <BrowserRouter>{children}</BrowserRouter>
      ) : (
        <MemoryRouter
          initialEntries={[
            state === undefined ? route : { pathname: route, state },
          ]}
        >
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        </MemoryRouter>
      )}
    </Provider>
  );

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};
