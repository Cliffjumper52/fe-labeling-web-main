<<<<<<< Updated upstream
import api from "../api/axios";
=======
import {
  getInfoByToken as getInfoByTokenService,
  login as loginService,
  refreshToken as refreshTokenService,
  resetPassword as resetPasswordService,
  updatePassword as updatePasswordService,
} from "./auth-service.service";

type AuthRole = "admin" | "manager" | "annotator" | "reviewer";

type LoginResult = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    username?: string;
    email?: string;
    role?: AuthRole;
  };
};

const DEMO_USERS: Record<string, { password: string; role: AuthRole }> = {
  "admin@gmail.com": { password: "123", role: "admin" },
  "admin@example.com": { password: "123456", role: "admin" },
  "manager@gmail.com": { password: "123", role: "manager" },
  "manager@example.com": { password: "123456", role: "manager" },
  "annotator@gmail.com": { password: "123", role: "annotator" },
  "annotator@example.com": { password: "123456", role: "annotator" },
  "anotator@gmail.com": { password: "123", role: "annotator" },
  "reviewer@gmail.com": { password: "123", role: "reviewer" },
  "reviewer@example.com": { password: "123456", role: "reviewer" },
};

const wrapLoginPayload = (payload: LoginResult) => ({ data: payload });
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
