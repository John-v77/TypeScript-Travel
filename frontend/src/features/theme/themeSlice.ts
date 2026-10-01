import { createSlice } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
}

const initialState: ThemeState = {
  theme: "light",
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: state => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
  },
  selectors: {
    selectTheme: state => state.theme,
  },
});

export const { toggleTheme } = themeSlice.actions;
export const { selectTheme } = themeSlice.selectors;
