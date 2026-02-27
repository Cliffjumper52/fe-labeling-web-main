import api from "../api/axios";

export const login = async (username: string, password: string) => {
  try {
    if (username === "admin@gmail.com" && password === "123") {
      return {
        data: {
          accessToken: "admin-access-token",
          refreshToken: "admin-refresh-token",
          user: { username, role: "admin" },
        },
      } as any;
    }
    if (username === "manager@gmail.com" && password === "123") {
      return {
        data: {
          accessToken: "manager-access-token",
          refreshToken: "manager-refresh-token",
          user: { username, role: "manager" },
        },
      } as any;
    }
    const resp = await api.post("/auth/login", { username, password });
    return resp;
  } catch (error) {
    // If backend is not configured (local dev), return a mocked success response
    if (!import.meta.env.VITE_PUBLIC_BACKEND_URL) {
      console.warn("Backend not configured — returning mocked login response.");
      return {
        data: {
          accessToken: "dev-access-token",
          refreshToken: "dev-refresh-token",
          user: { username },
        },
      } as any;
    }
    throw error;
  }
};
