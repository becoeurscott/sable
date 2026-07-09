// Browser-side session storage (access/refresh tokens + active org id).
// Kept in one place so the API client can attach headers without React, and
// the auth context can react to changes. localStorage → survives refreshes.

const ACCESS = "sable.accessToken";
const REFRESH = "sable.refreshToken";
const ORG = "sable.orgId";

const isBrowser = typeof window !== "undefined";

export function getToken(): string | null {
  return isBrowser ? window.localStorage.getItem(ACCESS) : null;
}
export function getRefreshToken(): string | null {
  return isBrowser ? window.localStorage.getItem(REFRESH) : null;
}
export function getOrgId(): string | null {
  return isBrowser ? window.localStorage.getItem(ORG) : null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS, accessToken);
  window.localStorage.setItem(REFRESH, refreshToken);
}

export function setOrgId(orgId: string): void {
  if (isBrowser) window.localStorage.setItem(ORG, orgId);
}

export function clearSession(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
  window.localStorage.removeItem(ORG);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
