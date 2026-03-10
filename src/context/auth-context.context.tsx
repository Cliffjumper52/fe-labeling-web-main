import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getInfoByToken } from "../services/auth-service.service";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens as persistAuthTokens,
} from "../utils/auth-storage";
import type { Account } from "../interface";

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuthTokens: (
    accessToken?: string | null,
    refreshToken?: string | null,
  ) => void;
  getUserInfo: () => Account | null;
  setUserInfo: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessToken(),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    getRefreshToken(),
  );

  const syncTokensFromCookies = useCallback(() => {
    setAccessToken(getAccessToken());
    setRefreshToken(getRefreshToken());
  }, []);

  const setAuthTokens = useCallback(
    (nextAccessToken?: string | null, nextRefreshToken?: string | null) => {
      persistAuthTokens(nextAccessToken, nextRefreshToken);
      syncTokensFromCookies();
    },
    [syncTokensFromCookies],
  );

  const logout = useCallback(() => {
    clearAuthTokens();
    setAccessToken(null);
    setRefreshToken(null);
    clearUserInfo();
  }, []);

  const setUserInfo = useCallback(async () => {
    try {
      const userInfoResp = await getInfoByToken();
      localStorage.setItem("user", JSON.stringify(userInfoResp?.data?.data));
    } catch {
      logout();
    }
  }, [logout]);

  const getUserInfo = useCallback(() => {
    const userInfoStr = localStorage.getItem("user");
    if (!userInfoStr) {
      return null;
    }

    try {
      return JSON.parse(userInfoStr) as Account;
    } catch {
      return null;
    }
  }, []);

  const clearUserInfo = useCallback(() => {
    localStorage.removeItem("user");
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      setAuthTokens,
      getUserInfo,
      setUserInfo,
      logout,
    }),
    [
      accessToken,
      refreshToken,
      setAuthTokens,
      getUserInfo,
      setUserInfo,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
