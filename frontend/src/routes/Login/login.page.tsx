import { useState } from "react";
import "./login.page.css";

import React from "react";
import { useLoginMutation } from "../../features/authSlice/authApiSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../features/authSlice/authStorageSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [login, { isLoading, error, isSuccess, data }] = useLoginMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await login(formData).unwrap();
      dispatch(
        loginSuccess({
          user: result.data.user,
          token: result.token,
          expiresInHours: 1,
        }),
      );
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-form">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            Logging in...
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="login-container">
        <div className="login-form">
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            Login failed. Please try again later.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="login-btn"
            style={{ marginTop: "1rem" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If login is successful, show success message
  if (isSuccess && data) {
    const userPhoto = data.data.user.photo || "/img/users/Default.jpg";

    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Login Successful!</h2>
          <div className="user-profile">
            <img
              src={userPhoto}
              alt={data.data.user.name}
              className="user-photo"
            />
            <div className="success-message">
              Welcome back, {data.data.user.name}!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
