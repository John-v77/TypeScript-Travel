import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout as clearAuthStorage } from "./authStorageSlice";
import { apiUrl } from "../../config/api";

export type User = {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  active: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupData = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type AuthResponse = {
  status: string;
  token: string;
  data: {
    user: User;
  };
};

export const authApiSlice = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${apiUrl}/` }),
  tagTypes: ["Auth"],
  endpoints: builder => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: credentials => ({
        url: "users/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: [{ type: "Auth", id: "LIST" }],
    }),
    signup: builder.mutation<AuthResponse, SignupData>({
      query: data => ({
        url: "users/signup",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<
      { status: string; message: string },
      { email: string }
    >({
      query: body => ({
        url: "users/forgotPassword",
        method: "POST",
        body,
      }),
    }),
    // Logout
    logout: builder.mutation<undefined, undefined>({
      queryFn: (_arg, { dispatch }) => {
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
  useForgotPasswordMutation,
  useLogoutMutation,
} = authApiSlice;
