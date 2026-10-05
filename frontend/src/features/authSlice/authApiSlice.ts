import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout as clearAuthStorage } from "./authStorageSlice";

export interface User {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export const authApiSlice = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:3000/api/v1/" }),
  tagTypes: ["Auth"],
  endpoints: builder => ({
    // Login
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: credentials => ({
        url: "users/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: [{ type: "Auth", id: "LIST" }],
    }),
    // Signup - the backend signs the new account in and returns a token.
    signup: builder.mutation<AuthResponse, SignupData>({
      query: data => ({
        url: "users/signup",
        method: "POST",
        body: data,
      }),
    }),
    // Logout
    logout: builder.mutation<void, void>({
      queryFn: async (_arg, { dispatch }) => {
        dispatch(clearAuthStorage());
        return { data: undefined };
      },
      invalidatesTags: [{ type: "Auth", id: "LIST" }],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
} = authApiSlice;
