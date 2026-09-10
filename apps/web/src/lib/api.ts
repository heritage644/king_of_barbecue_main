export const apiProxyBase = process.env.NEXT_PUBLIC_API_PROXY_BASE ?? '/api';
const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

interface ApiOptions extends RequestInit {
  json?: unknown;
}

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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? 'Request failed', data?.error?.code, data?.error?.details);
  }
  return data as T;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, ...requestInit } = options;
  const headers = new Headers(requestInit.headers);
  const init: RequestInit = {
    ...requestInit,
    headers,
    credentials: 'include'
  };

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(json);
  } else if (requestInit.body !== undefined) {
    init.body = requestInit.body;
  }

  const response = await fetch(`${apiProxyBase}${path}`, init);
  return parseResponse<T>(response);
}

export async function serverApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiInternalUrl}/api${path}`, {
    ...init,
    cache: init.cache ?? 'no-store'
  });
  return parseResponse<T>(response);
}
