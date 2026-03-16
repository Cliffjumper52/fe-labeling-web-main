import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getInfoByToken } from "../services/auth-service";
import {
  clearAuthTokens,
  getAccessToken,
  getRememberMePreference,
  getRefreshToken,
  setAuthTokens as persistAuthTokens,
} from "../utils/auth-storage";
import type { Account } from "../interface";

const USER_INFO_KEY = "user";

type SetAuthTokensOptions = {
  rememberMe?: boolean;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuthTokens: (
    accessToken?: string | null,
    refreshToken?: string | null,
    options?: SetAuthTokensOptions,
  ) => void;
  getUserInfo: () => Account | null;
  setUserInfo: (rememberMe?: boolean) => Promise<void>;
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
    (
      nextAccessToken?: string | null,
      nextRefreshToken?: string | null,
      options?: SetAuthTokensOptions,
    ) => {
      persistAuthTokens(nextAccessToken, nextRefreshToken, options);
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

  const setUserInfo = useCallback(
    async (rememberMe?: boolean) => {
      try {
        const userInfoResp = await getInfoByToken();
        const userInfo = JSON.stringify(userInfoResp?.data?.data);
        const shouldRemember =
          typeof rememberMe === "boolean"
            ? rememberMe
            : getRememberMePreference();

        if (shouldRemember) {
          localStorage.setItem(USER_INFO_KEY, userInfo);
          sessionStorage.removeItem(USER_INFO_KEY);
        } else {
          sessionStorage.setItem(USER_INFO_KEY, userInfo);
          localStorage.removeItem(USER_INFO_KEY);
        }
      } catch {
        logout();
      }
    },
    [logout],
  );

  const getUserInfo = useCallback(() => {
    const userInfoStr =
      sessionStorage.getItem(USER_INFO_KEY) ??
      localStorage.getItem(USER_INFO_KEY);
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
    localStorage.removeItem(USER_INFO_KEY);
    sessionStorage.removeItem(USER_INFO_KEY);
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
