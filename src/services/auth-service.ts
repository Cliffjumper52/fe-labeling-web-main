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
  "manager@gmail.com": { password: "123", role: "manager" },
  "annotator@gmail.com": { password: "123", role: "annotator" },
  "anotator@gmail.com": { password: "123", role: "annotator" },
  "reviewer@gmail.com": { password: "123", role: "reviewer" },
};

const wrapLoginPayload = (payload: LoginResult) => ({ data: payload });

export const login = async (username: string, password: string) => {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const demo = DEMO_USERS[normalizedUsername];
  if (demo && demo.password === normalizedPassword) {
    return wrapLoginPayload({
      accessToken: `${demo.role}-access-token`,
      refreshToken: `${demo.role}-refresh-token`,
      user: {
        username: normalizedUsername,
        email: normalizedUsername,
        role: demo.role,
      },
    });
  }

  const result = (await loginService(normalizedUsername, normalizedPassword)) as LoginResult | {
    data?: LoginResult;
  };
  const normalized = (result as { data?: LoginResult })?.data
    ? (result as { data: LoginResult }).data
    : (result as LoginResult);

  // Some backends return `account` instead of `user`; normalize once here.
  if (!normalized.user && (normalized as LoginResult & { account?: LoginResult["user"] }).account) {
    normalized.user = (normalized as LoginResult & { account?: LoginResult["user"] }).account;
  }

  return wrapLoginPayload(normalized);
};

export const getInfoByToken = async () => getInfoByTokenService();

export const updatePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) => updatePasswordService(id, currentPassword, newPassword);

export const resetPassword = async (email: string) => resetPasswordService(email);

export const refreshToken = async () => refreshTokenService();
