import axios from "axios";
import { refreshToken } from "../services/auth-service.service";
import {
  clearAuthTokens,
  getAccessToken,
  setAuthTokens as persistAuthTokens,
} from "../utils/auth-storage";

const baseURL = import.meta.env.DEV
  ? `/${import.meta.env.VITE_PUBLIC_BACKEND_PREFIX}/${import.meta.env.VITE_PUBLIC_BACKEND_VERSION}`
  : `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/${import.meta.env.VITE_PUBLIC_BACKEND_PREFIX}/${import.meta.env.VITE_PUBLIC_BACKEND_VERSION}`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL,
  withCredentials: true,
});

// Request Interceptor – attach Bearer token when available
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

refreshApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor – auto-refresh on 401 & retry original request
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  for (const p of pendingQueue) {
    if (error) {
      p.reject(error);
    } else {
      p.resolve();
    }
  }
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const result = await refreshToken();
        const resultData = result?.data;
        const newAccessToken = resultData?.accessToken;
        const newRefreshToken = resultData?.refreshToken;

        persistAuthTokens(newAccessToken, newRefreshToken);
        processQueue(null);

        // Retry the original request with the new token
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAuthTokens();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { refreshApi };
