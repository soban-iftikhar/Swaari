import axios from "axios";

/**
 * Central Axios instance for the Swaari REST API.
 *
 * - Base URL comes from VITE_BASE_URL.
 * - `withCredentials` lets the browser send/receive the httpOnly auth cookie.
 * - A request interceptor also attaches the bearer token from localStorage so
 *   the API works whether the client relies on cookies or header auth.
 * - A response interceptor normalises errors into a friendly `.message` and
 *   clears stale credentials on 401 so the UI can redirect to login.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach bearer token when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors; surface a clean message and handle auth expiry.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message ||
      "Something went wrong. Please try again.";

    // On unauthorised, drop stale credentials (the wrapper will redirect).
    if (status === 401 && typeof window !== "undefined") {
      const onAuthPage = /\/(login|signup)/.test(window.location.pathname);
      if (!onAuthPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    }

    return Promise.reject(new Error(message));
  },
);

export default api;
