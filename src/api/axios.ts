import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const buildBaseUrl = () => {
  const root = (import.meta.env.VITE_PUBLIC_BACKEND_URL ?? "").trim();
  const prefix = (import.meta.env.VITE_PUBLIC_BACKEND_PREFIX ?? "").trim();
  const version = (import.meta.env.VITE_PUBLIC_BACKEND_VERSION ?? "").trim();

  if (!root) {
    return "";
  }

  const normalizedRoot = root.replace(/\/+$/, "");
  const segments = [prefix, version]
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

  return segments.length > 0
    ? `${normalizedRoot}/${segments.join("/")}`
    : normalizedRoot;
};

const BASE_URL = buildBaseUrl();

export const refreshApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh");

    if (!isUnauthorized || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const currentRefreshToken = localStorage.getItem("refreshToken");
      const refreshResponse = await refreshApi.post("/auth/refresh", {
        refreshToken: currentRefreshToken,
      });

      const nextAccessToken =
        (refreshResponse.data as { accessToken?: string })?.accessToken ?? "";

      if (!nextAccessToken) {
        throw new Error("Refresh response missing access token");
      }

      localStorage.setItem("accessToken", nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
