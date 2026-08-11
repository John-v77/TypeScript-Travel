import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "production"
    ? `https://to-be-asigned`
    : "http://127.0.0.1:3000/api/v1";

const API = axios.create({
  baseURL,
});

const actions = {
  // User Authentication
  loginUser: async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${baseURL}/users/login`, credentials);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response;
  },
};
export default actions;
