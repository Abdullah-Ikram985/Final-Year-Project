import axios from "axios";

export const BASE_URL = "http://localhost:8000";
export const API_VERSION = "/api/v1/";

const apiClient = axios.create({
  baseURL: `${BASE_URL}${API_VERSION}`,
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

export default apiClient;
