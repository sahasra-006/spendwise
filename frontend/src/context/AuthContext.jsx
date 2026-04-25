import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

const initialState = {
  user:        JSON.parse(localStorage.getItem('user')) || null,
  token:       localStorage.getItem('token') || null,
  isLoading:   false,
  isInitialized: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'INITIALIZED':
      return { ...state, isInitialized: true };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount (handles page refresh)
  useEffect(() => {
    const init = async () => {
      if (state.token) {
        try {
          const { data } = await authAPI.getMe();
          dispatch({ type: 'UPDATE_USER', payload: data.user });
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          // Token invalid — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      }
      dispatch({ type: 'INITIALIZED' });
    };
    init();
  }, []); // eslint-disable-line

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
