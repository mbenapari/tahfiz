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
    const response = await nativeFetch('/api/csrf-token');
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

  if (isStateChanging && !csrfToken) {
    await fetchCsrfToken();
  }

  const headers = new Headers(options.headers || {});
  if (isStateChanging && csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }

  const response = await nativeFetch(url, {
    ...options,
    headers,
  });

  // If we get a 403 Forbidden, it might be an expired CSRF token
  if (response.status === 403 && isStateChanging) {
    await fetchCsrfToken();
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
      return nativeFetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
};
