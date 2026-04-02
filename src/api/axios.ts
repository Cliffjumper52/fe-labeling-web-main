import axios from "axios";
import { refreshToken } from "../services/auth-service.service";
import {
  clearAuthTokens,
  getAccessToken,
  setAuthTokens as persistAuthTokens,
} from "../utils/auth-storage";
const api = axios.create({
  baseURL: `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/${import.meta.env.VITE_PUBLIC_BACKEND_PREFIX}/${import.meta.env.VITE_PUBLIC_BACKEND_VERSION}`,
  withCredentials: true, //use cookies token
});

const refreshApi = axios.create({
  baseURL: `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/${import.meta.env.VITE_PUBLIC_BACKEND_PREFIX}/${import.meta.env.VITE_PUBLIC_BACKEND_VERSION}`,
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    console.log("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
    });
//1
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const result = await refreshToken();
        const resultData =
          (result as { data?: { accessToken?: string; refreshToken?: string } })
            ?.data ??
          (result as { accessToken?: string; refreshToken?: string });
        const newAccessToken = resultData?.accessToken;
        const newRefreshToken = resultData?.refreshToken;

        persistAuthTokens(newAccessToken, newRefreshToken);

        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (_refreshError) {
        // Handle token refresh failure (e.g., redirect to login);
        clearAuthTokens();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { refreshApi };
