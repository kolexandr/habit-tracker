const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const apiBaseUrl = API_BASE_URL;

export const apiFetch = async (path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
};

export const readApiError = async (response: Response, fallbackMessage: string) => {
  const rawResponse = await response.text();

  if (!rawResponse) {
    return `${fallbackMessage} (${response.status})`;
  }

  try {
    const parsed = JSON.parse(rawResponse) as { message?: string };
    return parsed.message ?? `${fallbackMessage} (${response.status})`;
  } catch {
    return rawResponse;
  }
};
