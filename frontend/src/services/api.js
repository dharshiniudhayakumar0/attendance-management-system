import axios from "axios";

// Create an axios instance
const api = axios.create({
  baseURL: "/",
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration/401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // In a real app, attempt to use refresh token here. 
      // For simplicity in this demo, if we get 401, we just clear auth and redirect to login.
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
