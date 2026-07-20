import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SchoolProvider } from "./context/SchoolContext";
import { apiFetch, setNativeFetch } from "./utils/api";

// Global fetch interceptor for CSRF protection
const originalFetch = window.fetch;
setNativeFetch(originalFetch);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Only intercept /api calls and skip the csrf-token endpoint itself to avoid recursion
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  
  if (url.includes('/api/') && !url.includes('/api/csrf-token')) {
    return apiFetch(url, init);
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <SchoolProvider>
        <NotificationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </NotificationProvider>
      </SchoolProvider>
    </AuthProvider>
  </React.StrictMode>,
);
