const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const ACCESS_TOKEN_KEY = "kitobchi_access_token";
const REFRESH_TOKEN_KEY = "kitobchi_refresh_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Access tokens expire after 15 minutes; when a request comes back 401 we
// exchange the refresh token for a new pair once (shared across concurrent
// requests) and retry. On refresh failure the session is over — clear tokens
// so the UI falls back to logged-out state instead of failing silently.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      storeTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildInit(
  init: RequestInit | undefined,
  jsonBody: boolean,
): RequestInit {
  const headers: Record<string, string> = {
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  // If the caller attached an (possibly stale) access token, always swap in
  // the current one — after a refresh the retry then carries the new token.
  if (headers.Authorization) {
    const fresh = authHeaders() as Record<string, string>;
    if (fresh.Authorization) headers.Authorization = fresh.Authorization;
  }
  return { ...init, headers };
}

async function requestWithRetry(
  path: string,
  init: RequestInit | undefined,
  jsonBody: boolean,
): Promise<Response> {
  let res = await fetch(`${API_BASE_URL}${path}`, buildInit(init, jsonBody));

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !path.startsWith("/auth/") &&
    (await tryRefreshTokens())
  ) {
    res = await fetch(`${API_BASE_URL}${path}`, buildInit(init, jsonBody));
  }

  return res;
}

async function throwApiError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;
  throw new ApiError(
    res.status,
    body?.error?.code ?? "UNKNOWN_ERROR",
    body?.error?.message ?? res.statusText,
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await requestWithRetry(path, init, true);
  if (!res.ok) await throwApiError(res);
  return res.json() as Promise<T>;
}

// Multipart upload — lets the browser set the Content-Type boundary itself,
// so it must NOT force an application/json content type.
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await requestWithRetry(
    path,
    { method: "POST", headers: authHeaders(), body: formData },
    false,
  );
  if (!res.ok) await throwApiError(res);
  return res.json() as Promise<T>;
}

export {
  apiFetch,
  apiUpload,
  API_BASE_URL,
  getAccessToken,
  authHeaders,
  storeTokens,
  clearTokens,
};
