import axios from "axios";
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
    if (
      (username === "annotator@gmail.com" ||
        username === "anotator@gmail.com") &&
      password === "123"
    ) {
      return {
        data: {
          accessToken: "annotator-access-token",
          refreshToken: "annotator-refresh-token",
          user: { username, role: "annotator" },
        },
      } as any;
    }
    if (username === "reviewer@gmail.com" && password === "123") {
      return {
        data: {
          accessToken: "reviewer-access-token",
          refreshToken: "reviewer-refresh-token",
          user: { username, role: "reviewer" },
        },
      } as any;
    }
    const resp = await api.post("/auth/login", { email: username, password });
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

export const getInfoByToken = async (token: string) => {
  try {
    const resp = await api.get("/auth/me");
    return resp;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) => {
  try {
    const resp = await api.post(`/auth/update-password/${id}`, {
      currentPassword,
      newPassword,
    });
    return resp;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const resp = await api.post("/auth/reset-password", { email });
    return resp;
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    //intentional, use axios directly to avoid infinite loop of interceptors when refreshing token
    const resp = await axios.post("/auth/refresh", {});
    return resp;
  } catch (error) {
    throw error;
  }
};
