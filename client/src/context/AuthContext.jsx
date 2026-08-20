import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';
import { getStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  // Tri-state so ProtectedRoute can tell "still checking" apart from
  // "checked, not logged in" and avoid a flash-redirect to /login on reload.
  const [status, setStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    authService
      .fetchCurrentAdmin()
      .then((currentAdmin) => {
        setAdmin(currentAdmin);
        setStatus('authenticated');
      })
      .catch(() => {
        setStatus('unauthenticated');
      });
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const loggedInAdmin = await authService.login(email, password);
    setAdmin(loggedInAdmin);
    setStatus('authenticated');
    return loggedInAdmin;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAdmin(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ admin, status, error, setError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
