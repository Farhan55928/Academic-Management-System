import axios from 'axios';
import { classifyError, ErrorKind } from './errors.js';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 600;

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:9000'}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: TIMEOUT_MS,
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ams_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const info = classifyError(error);
    const config = error.config;

    // Retry idempotent GETs on failures that are likely transient
    // (cold starts, dropped connections, DB unavailable) — never on
    // mutations, which could double-submit.
    const isGet = (config?.method ?? '').toLowerCase() === 'get';
    if (isGet && info.retryable && config) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      if (config.__retryCount <= MAX_RETRIES) {
        const delay = BASE_BACKOFF_MS * 2 ** (config.__retryCount - 1) + Math.random() * 250;
        await sleep(delay);
        return api(config);
      }
    }

    // A genuine auth rejection means the session is no longer valid —
    // except on the login call itself, where a 401 just means the
    // credentials were wrong and the user is staying on the login page.
    const isLoginCall = (config?.url ?? '').includes('/auth/login');
    if (info.kind === ErrorKind.AUTH && !isLoginCall) {
      localStorage.removeItem('ams_token');
      localStorage.removeItem('ams_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    error.info = info;
    return Promise.reject(error);
  }
);

export default api;
