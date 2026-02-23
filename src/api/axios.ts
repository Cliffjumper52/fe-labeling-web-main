import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_PUBLIC_BACKEND_URL}
  /${import.meta.env.VITE_PUBLIC_BACKEND_PREFIX}
  /${import.meta.env.VITE_PUBLIC_BACKEND_VERSION}`,
  withCredentials: true, //use cookies token
});

// Request Interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
        // Attempt to refresh token, implement later
        throw new Error("Token refresh not implemented");
      } catch (error) {
        // Handle token refresh failure (e.g., redirect to login);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
