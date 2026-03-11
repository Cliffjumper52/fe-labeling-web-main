import api, { refreshApi } from "../api/axios";

type UserRole = "admin" | "manager" | "annotator" | "reviewer";

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  role?: UserRole;
  user?: {
    id?: string;
    email?: string;
    username?: string;
    role?: UserRole;
  };
};

const useMockAuth = String(import.meta.env.VITE_USE_MOCK_AUTH ?? "false") === "true";

const mockRoleFromEmail = (email: string): UserRole => {
  if (email.includes("admin")) return "admin";
  if (email.includes("manager")) return "manager";
  if (email.includes("reviewer")) return "reviewer";
  return "annotator";
};

export const login = async (email: string, password: string) => {
  if (useMockAuth) {
    return {
      data: {
        accessToken: "dev-access-token",
        refreshToken: "dev-refresh-token",
        user: { email, role: mockRoleFromEmail(email) },
      },
    };
  }

  return api.post<LoginResponse>("/auth/login", {
    email,
    username: email,
    password,
  });
};

export const getInfoByToken = async () => api.get("/auth/me");

export const updatePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) =>
  api.patch(`/auth/update-password/${id}`, {
    currentPassword,
    newPassword,
  });

export const resetPassword = async (email: string) =>
  api.patch("/auth/reset-password", { email });

export const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem("refreshToken");
  return refreshApi.post("/auth/refresh", {
    refreshToken: currentRefreshToken,
  });
};
