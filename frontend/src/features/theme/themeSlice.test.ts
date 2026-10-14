import { makeStore } from "../../app/store";
import { selectTheme, themeSlice, toggleTheme } from "./themeSlice";

describe("themeSlice", () => {
  it("starts in light mode", () => {
    expect(themeSlice.reducer(undefined, { type: "init" })).toEqual({
      theme: "light",
    });
  });

  it("toggles light to dark and back", () => {
    const dark = themeSlice.reducer({ theme: "light" }, toggleTheme());
    expect(dark.theme).toBe("dark");

    const light = themeSlice.reducer(dark, toggleTheme());
    expect(light.theme).toBe("light");
  });

  it("is readable from the app store", () => {
    const store = makeStore();
    expect(selectTheme(store.getState())).toBe("light");

    store.dispatch(toggleTheme());
    expect(selectTheme(store.getState())).toBe("dark");
  });
});
