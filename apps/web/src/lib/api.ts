export const apiProxyBase = process.env.NEXT_PUBLIC_API_PROXY_BASE ?? '/api';
const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

interface ApiOptions extends RequestInit {
  json?: unknown;
}

type ServerFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export class ApiError extends Error {
  status: number;
  code: string | undefined;
  details: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const browserGetInFlight = new Map<string, Promise<unknown>>();
const browserGetCache = new Map<string, { expiresAt: number; value: unknown }>();
const CLIENT_GET_DEDUPE_TTL_MS = 1_000;

function shouldDedupeClientGet(method: string, hasBody: boolean) {
  return typeof window !== 'undefined' && method === 'GET' && !hasBody;
}

function browserDedupeKey(url: string, init: RequestInit) {
  return JSON.stringify({
    url,
    method: init.method ?? 'GET',
    credentials: init.credentials ?? 'same-origin'
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? data?.message ?? 'Request failed', data?.error?.code, data?.error?.details ?? data?.errors);
  }
  return data as T;
}

async function fetchAndParse<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  return parseResponse<T>(response);
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, ...requestInit } = options;
  const headers = new Headers(requestInit.headers);
  const method = (requestInit.method ?? 'GET').toUpperCase();
  const init: RequestInit = {
    ...requestInit,
    method,
    headers,
    credentials: 'include'
  };

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(json);
  } else if (requestInit.body !== undefined) {
    init.body = requestInit.body;
  }

  const url = `${apiProxyBase}${path}`;
  const hasBody = init.body !== undefined && init.body !== null;

  if (shouldDedupeClientGet(method, hasBody)) {
    const key = browserDedupeKey(url, init);
    const cached = browserGetCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const existing = browserGetInFlight.get(key);
    if (existing) return existing as Promise<T>;

    const request = fetchAndParse<T>(url, init)
      .then((value) => {
        browserGetCache.set(key, { value, expiresAt: Date.now() + CLIENT_GET_DEDUPE_TTL_MS });
        return value;
      })
      .finally(() => {
        browserGetInFlight.delete(key);
      });

    browserGetInFlight.set(key, request);
    return request;
  }

  return fetchAndParse<T>(url, init);
}

export async function serverApiFetch<T>(path: string, init: ServerFetchInit = {}): Promise<T> {
  const requestInit: ServerFetchInit = { ...init };

  // Next.js requires choosing either dynamic no-store fetching or ISR revalidation.
  // Only default to no-store when the caller has not supplied its own cache mode
  // and has not requested `next.revalidate`.
  if (!requestInit.cache && !requestInit.next) {
    requestInit.cache = 'no-store';
  }

  const response = await fetch(`${apiInternalUrl}/api${path}`, requestInit);
  return parseResponse<T>(response);
}
