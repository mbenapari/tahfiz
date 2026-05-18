let csrfToken: string | null = null;
let nativeFetch = window.fetch;

/**
 * Sets the native fetch function to be used by apiFetch.
 * This is used to avoid circular dependencies when window.fetch is intercepted.
 */
export const setNativeFetch = (fn: typeof fetch) => {
  nativeFetch = fn;
};

export const fetchCsrfToken = async () => {
  try {
    const response = await nativeFetch('/api/csrf-token', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  return null;
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const method = options.method?.toUpperCase() || 'GET';
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Always include credentials to ensure cookies (JWT and CSRF) are sent/received
  const fetchOptions: RequestInit = {
    credentials: 'include',
    ...options,
  };

  if (isStateChanging && !csrfToken) {
    await fetchCsrfToken();
  }

  const headers = new Headers(fetchOptions.headers || {});
  if (isStateChanging && csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }
  fetchOptions.headers = headers;

  let response = await nativeFetch(url, fetchOptions);

  // If we get a 403 Forbidden, it might be an expired or invalid CSRF token
  // (e.g. if the user's auth state changed from anonymous to authenticated)
  if (response.status === 403 && isStateChanging) {
    console.warn(`CSRF 403 on ${url}, retrying with fresh token...`);
    await fetchCsrfToken();
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
      fetchOptions.headers = headers;
      response = await nativeFetch(url, fetchOptions);
    }
  }

  return response;
};
