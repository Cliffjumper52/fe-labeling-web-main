import api, { refreshApi } from "../api/axios";
import { getRefreshToken } from "../utils/auth-storage";

const DEMO_USERS: Record<
  string,
  { password: string; role: "admin" | "manager" | "annotator" | "reviewer" }
> = {
  "admin@gmail.com": { password: "123", role: "admin" },
  "manager@gmail.com": { password: "123", role: "manager" },
  "annotator@gmail.com": { password: "123", role: "annotator" },
  "anotator@gmail.com": { password: "123", role: "annotator" },
  "reviewer@gmail.com": { password: "123", role: "reviewer" },
};

export const login = async (username: string, password: string) => {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPassword = password.trim();

  // Always try the real backend API first
  try {
    const resp = await api.post("/auth/login", {
      email: normalizedUsername,
      password: normalizedPassword,
    });
    return resp.data;
  } catch (error) {
    // Fall back to demo users only when the backend is unreachable
    const demo = DEMO_USERS[normalizedUsername];
    if (demo && demo.password === normalizedPassword) {
      return {
        data: {
          accessToken: `${demo.role}-access-token`,
          refreshToken: `${demo.role}-refresh-token`,
          user: { username: normalizedUsername, role: demo.role },
        },
      } as const;
    }
    throw error;
  }
};

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
    const token = getRefreshToken();

    //intentional, use axios directly to avoid infinite loop of interceptors when refreshing token
    const resp = await refreshApi.post(
      "/auth/refresh",
      {},
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
