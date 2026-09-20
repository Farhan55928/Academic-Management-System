import { useState, useCallback, useEffect } from 'react';
import { login as apiLogin, getMe as apiGetMe } from '../api/auth.js';

const TOKEN_KEY = 'ams_token';
const USER_KEY  = 'ams_user';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });

  // On mount, refresh the user from /me so we have googleConnected etc.
  // Silent on failure (expired token etc.) — the axios interceptor handles
  // redirecting to /login.
  useEffect(() => {
    if (!token) return;
    apiGetMe().then(res => {
      const fresh = res.data;
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY,  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, isAuthenticated: !!token, login, logout };
}
