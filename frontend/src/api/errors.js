// Classifies an axios error into a stable shape every page can render
// honestly, instead of each call site inventing its own (often wrong)
// message. The key distinction this exists for: a request that never got a
// real response (offline, timeout, network drop, or a gateway's HTML error
// page) is NOT the same thing as the API rejecting the request — only a
// genuine JSON 401 from our own backend means "your credentials are wrong"
// or "sign in again".

export const ErrorKind = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  NETWORK: 'network',
  GATEWAY: 'gateway', // reached an edge/proxy but got back HTML/non-JSON (e.g. a Vercel 502/504 page)
  AUTH: 'auth', // genuine 401 from our API
  UNAVAIL: 'unavailable', // 503 DB_UNAVAILABLE
  NOTFOUND: 'notfound',
  SERVER: 'server',
  CLIENT: 'client',
  CANCELED: 'canceled',
  UNKNOWN: 'unknown',
};

const RETRYABLE = new Set([ErrorKind.TIMEOUT, ErrorKind.NETWORK, ErrorKind.GATEWAY, ErrorKind.UNAVAIL]);

const mk = (kind, message, cause, status, code) => ({
  kind,
  message,
  status,
  code,
  retryable: RETRYABLE.has(kind),
  cause,
});

export function classifyError(err) {
  if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
    return mk(ErrorKind.CANCELED, '', err);
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return mk(ErrorKind.OFFLINE, "You're offline. Check your connection and try again.", err);
  }

  // No response object at all means the request never completed.
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '')) {
      return mk(ErrorKind.TIMEOUT, 'The server is taking too long to respond. Please try again.', err);
    }
    return mk(ErrorKind.NETWORK, "Couldn't reach the server. Check your connection and try again.", err);
  }

  const { status, data } = err.response;
  const isJson = typeof data === 'object' && data !== null;
  const looksHtml = typeof data === 'string' && /<!doctype html|<html/i.test(data);

  // Reached an edge/proxy but the body isn't our JSON envelope — a cold
  // Vercel function or gateway timeout renders an HTML error page instead.
  if (!isJson && (looksHtml || status === 502 || status === 504)) {
    return mk(ErrorKind.GATEWAY, 'The server is waking up or under load. Please try again in a moment.', err, status);
  }

  const code = isJson ? data.code : undefined;
  const serverMsg = isJson ? data.message : undefined;

  if (status === 503 || code === 'DB_UNAVAILABLE') {
    return mk(ErrorKind.UNAVAIL, serverMsg || 'Service temporarily unavailable. Please try again.', err, status, code);
  }
  if (status === 401) {
    return mk(ErrorKind.AUTH, serverMsg || 'Your session is not valid. Please sign in again.', err, status, code);
  }
  if (status === 404) {
    return mk(ErrorKind.NOTFOUND, serverMsg || 'Not found.', err, status, code);
  }
  if (status >= 500) {
    return mk(ErrorKind.SERVER, serverMsg || 'Something went wrong on our side. Please try again.', err, status, code);
  }
  if (status >= 400) {
    return mk(ErrorKind.CLIENT, serverMsg || 'That request could not be completed.', err, status, code);
  }

  return mk(ErrorKind.UNKNOWN, serverMsg || 'Something went wrong. Please try again.', err, status, code);
}

// Drop-in replacement for the old `err?.response?.data?.message || 'Fallback'`
// pattern used across mutation handlers.
export const errorMessage = (err, fallback = 'Something went wrong.') =>
  classifyError(err).message || fallback;
