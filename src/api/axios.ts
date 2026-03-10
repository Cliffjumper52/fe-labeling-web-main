import axios from "axios";
import { refreshToken } from "../services/auth-service.service";

import Cookies from "js-cookie";
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
  (config) => config,
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
    });

    if (error.response?.status === 401) {
      try {
        const result = await refreshToken();
        const resultData = result?.data;
        const newAccessToken = resultData?.accessToken;
        const newRefreshToken = resultData?.refreshToken;

        if (newAccessToken) Cookies.set("accessToken", newAccessToken);
        if (newRefreshToken) Cookies.set("refreshToken", newRefreshToken);
      } catch (error) {
        // Handle token refresh failure (e.g., redirect to login);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { refreshApi };
