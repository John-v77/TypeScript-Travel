import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./authApiSlice";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  expiresAt: null,
};

const saveToLocalStorageWithExpiry = (
  token: string,
  user: User,
  expiresInHours: number,
) => {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("tokenExpiresAt", expiresAt.toString());

  return expiresAt;
};

const clearLocalStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("tokenExpiresAt");
};

const isTokenExpired = (expiresAt: number | null): boolean => {
  if (!expiresAt) return true;
  return Date.now() > expiresAt;
};

const clearAuthState = (state: AuthState) => {
  clearLocalStorage();

  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  state.expiresAt = null;
};

const loadFromLocalStorage = (): AuthState => {
  try {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const expiresAt = localStorage.getItem("tokenExpiresAt");

    if (token && userData && expiresAt) {
      const expiry = parseInt(expiresAt);

      if (isTokenExpired(expiry)) {
        clearLocalStorage();
        return initialState;
      }

      return {
        user: JSON.parse(userData),
        token,
        isAuthenticated: true,
        expiresAt: expiry,
      };
    }
  } catch (error) {
    console.error("Error loading auth state from localStorage:", error);
    clearLocalStorage();
  }

  return initialState;
};

export const authStorageSlice = createSlice({
  name: "authStorage",
  initialState: loadFromLocalStorage(),
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        expiresInHours?: number;
      }>,
    ) => {
      const { user, token, expiresInHours = 24 } = action.payload;
      const expiresAt = saveToLocalStorageWithExpiry(
        token,
        user,
        expiresInHours,
      );

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.expiresAt = expiresAt;
    },

    checkTokenExpiry: state => {
      if (state.expiresAt && isTokenExpired(state.expiresAt)) {
        clearAuthState(state);
      }
    },

    logout: state => {
      clearAuthState(state);
    },

    refreshToken: (
      state,
      action: PayloadAction<{ token: string; expiresInHours?: number }>,
    ) => {
      const { token, expiresInHours = 24 } = action.payload;
      const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

      localStorage.setItem("token", token);
      localStorage.setItem("tokenExpiresAt", expiresAt.toString());

      state.token = token;
      state.expiresAt = expiresAt;
    },
  },
});

export const { loginSuccess, checkTokenExpiry, refreshToken, logout } =
  authStorageSlice.actions;

export const selectAuth = (state: { authStorage: AuthState }) =>
  state.authStorage;
export const selectUser = (state: { authStorage: AuthState }) =>
  state.authStorage.user;
export const selectToken = (state: { authStorage: AuthState }) =>
  state.authStorage.token;
export const selectIsAuthenticated = (state: { authStorage: AuthState }) =>
  state.authStorage.isAuthenticated;

export default authStorageSlice.reducer;
