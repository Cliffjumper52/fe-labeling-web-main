import Cookies from "js-cookie";

export const ACCESS_TOKEN_COOKIE = "AccessToken";
export const REFRESH_TOKEN_COOKIE = "RefreshToken";
export const REMEMBER_ME_KEY = "rememberMe";
export const REMEMBERED_LOGIN_KEY = "rememberedLoginIdentifier";

type SetAuthTokensOptions = {
  rememberMe?: boolean;
};

export function getRememberMePreference(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "1";
}

export function setRememberMePreference(rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, "1");
    return;
  }

  localStorage.removeItem(REMEMBER_ME_KEY);
}

export function getRememberedLoginIdentifier(): string {
  return localStorage.getItem(REMEMBERED_LOGIN_KEY) ?? "";
}

export function setRememberedLoginIdentifier(
  identifier: string | null | undefined,
  rememberMe: boolean,
): void {
  const normalizedIdentifier = identifier?.trim();

  if (rememberMe && normalizedIdentifier) {
    localStorage.setItem(REMEMBERED_LOGIN_KEY, normalizedIdentifier);
    return;
  }

  localStorage.removeItem(REMEMBERED_LOGIN_KEY);
}

export function getAccessToken(): string | null {
  return Cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
}

export function getRefreshToken(): string | null {
  return Cookies.get(REFRESH_TOKEN_COOKIE) ?? null;
}

export function setAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null,
  options?: SetAuthTokensOptions,
): void {
  const rememberMe = options?.rememberMe ?? getRememberMePreference();

  if (typeof options?.rememberMe === "boolean") {
    setRememberMePreference(options.rememberMe);
  }

  if (typeof accessToken !== "undefined") {
    if (accessToken) {
      Cookies.set(
        ACCESS_TOKEN_COOKIE,
        accessToken,
        rememberMe ? { expires: 30 } : undefined,
      );
    } else {
      Cookies.remove(ACCESS_TOKEN_COOKIE);
    }
  }

  if (typeof refreshToken !== "undefined") {
    if (refreshToken) {
      Cookies.set(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        rememberMe ? { expires: 30 } : undefined,
      );
    } else {
      Cookies.remove(REFRESH_TOKEN_COOKIE);
    }
  }
}

export function clearAuthTokens(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
}
