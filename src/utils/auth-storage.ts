import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "AccessToken";
const REFRESH_TOKEN_KEY = "RefreshToken";

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function setAuthTokens(
  accessToken: string,
  refreshToken: string,
): void {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { path: "/" });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { path: "/" });
}

export function clearAuthTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
}
