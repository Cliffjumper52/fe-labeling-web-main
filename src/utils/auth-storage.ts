import Cookies from "js-cookie";

export const ACCESS_TOKEN_COOKIE = "AccessToken";
export const REFRESH_TOKEN_COOKIE = "RefreshToken";

export function getAccessToken(): string | null {
  return Cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
}

export function getRefreshToken(): string | null {
  return Cookies.get(REFRESH_TOKEN_COOKIE) ?? null;
}

export function setAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null,
): void {
  if (typeof accessToken !== "undefined") {
    if (accessToken) {
      Cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
    } else {
      Cookies.remove(ACCESS_TOKEN_COOKIE);
    }
  }

  if (typeof refreshToken !== "undefined") {
    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken);
    } else {
      Cookies.remove(REFRESH_TOKEN_COOKIE);
    }
  }
}

export function clearAuthTokens(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
}
