import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import api from '../api/client.js';
import * as authApi from '../api/auth.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

const TOKEN_KEY = 'spendly_token';

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true };
    case 'SET_USER':
      return { ...state, user: action.user, token: action.token, loading: false };
    case 'CLEAR':
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    loading: true,
  });

  // On mount, validate stored token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    authApi
      .getMe()
      .then((res) => {
        dispatch({ type: 'SET_USER', user: res.data.data.user, token });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        dispatch({ type: 'CLEAR' });
      });
  }, []);

  // Wire 401 interceptor to clear auth and redirect
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const code = err.response?.data?.error?.code;
        if (
          err.response?.status === 401 &&
          (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN')
        ) {
          localStorage.removeItem(TOKEN_KEY);
          dispatch({ type: 'CLEAR' });
          toast('Session expired. Please sign in again.', 'error');
          // Let the router handle the redirect via ProtectedRoute
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [toast]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { token, user } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    dispatch({ type: 'SET_USER', user, token });
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token, user } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    dispatch({ type: 'SET_USER', user, token });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — we clear client-side regardless
    }
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser: (user) => dispatch({ type: 'SET_USER', user, token: state.token }) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
