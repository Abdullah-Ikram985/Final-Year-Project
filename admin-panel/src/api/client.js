import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "";
// When VITE_API_URL is empty, use relative /api which is proxied by vite.config.js to http://localhost:8000
export const API_VERSION = "/api/v1/";

const baseURL = BASE_URL ? `${BASE_URL}${API_VERSION}` : API_VERSION;

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    if (status === 401) {
      // Don't auto-logout on login page itself
      const isLoginRequest = error.config?.url?.includes("login");
      if (!isLoginRequest) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (import.meta.env.DEV) {
      console.error(`[API ${status || "NETWORK"}]`, message, error.config?.url);
    }

    return Promise.reject(error);
  },
);

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error.response) {
    return "Network error. Make sure the backend is running on http://localhost:8000";
  }
  return error.response?.data?.message || fallback;
};

export const loginAdmin = async (email, password) => {
  const response = await apiClient.post("users/login", { email, password });
  const token = response.data?.token;
  const user = response.data?.data?.user;
  if (!token) throw new Error("No token returned from backend");
  if (user?.role !== "admin") {
    throw new Error(`Access denied: role is '${user?.role}', admin required`);
  }
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminUser", JSON.stringify(user));
  return { token, user };
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};

export default apiClient;
