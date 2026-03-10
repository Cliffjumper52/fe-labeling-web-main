<<<<<<< Updated upstream
import api from "../api/axios";
=======
import api, { refreshApi } from "../api/axios";
>>>>>>> Stashed changes

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
      (username === "annotator@gmail.com" || username === "anotator@gmail.com") &&
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
<<<<<<< Updated upstream
    const resp = await api.post("/auth/login", { username, password });
=======
    
    const resp = await api.post("/auth/login", { email: username, password });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

export const getInfoByToken = async () => {
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
    const resp = await api.patch(`/auth/update-password/${id}`, {
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
    const resp = await api.patch("/auth/reset-password", { email });
    return resp;
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    // Intentional: avoid recursive interceptor handling by using refreshApi directly.
    const resp = refreshApi.post("/auth/refresh", {});
    return resp;
  } catch (error) {
    throw error;
  }
};
>>>>>>> Stashed changes
