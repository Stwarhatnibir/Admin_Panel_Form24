import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_STORAGE_KEY = 'admin_panel_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// Attach the JWT to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors into a single shape components can rely on:
// { status, message, details }. Also clears a stale/expired token on 401 so
// the next protected-route check redirects to /login instead of looping.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status ? 'Something went wrong. Please try again.' : 'Unable to reach the server. Check your connection.');
    const details = error.response?.data?.details;

    if (status === 401) {
      setStoredToken(null);
    }

    return Promise.reject({ status, message, details });
  }
);

export default api;
