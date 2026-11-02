import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { loginSuccess, logout as logoutAction, updateUser } from '../store/slices/authSlice';

/**
 * Single entry point for authentication in components. Wraps the auth API and
 * keeps Redux + localStorage in sync.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, initializing, loading, error } = useSelector((s) => s.auth);

  const role = user?.role ?? null;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isClient = role === 'client';
  const isStaff = isAdmin || isManager;

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(
        credentials.email,
        credentials.password,
        credentials.remember
      );
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      const destination =
        data.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard';
      navigate(destination, { replace: true });
      return data;
    },
    [dispatch, navigate]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success('Account created. Welcome to NexClient!');
      navigate('/client/dashboard', { replace: true });
      return data;
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout — we clear locally regardless.
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logoutAction());
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const refreshUser = useCallback(async () => {
    const data = await authService.getMe();
    dispatch(updateUser(data.user ?? data));
    return data.user ?? data;
  }, [dispatch]);

  return {
    user,
    role,
    isAuthenticated,
    initializing,
    loading,
    error,
    isAdmin,
    isManager,
    isClient,
    isStaff,
    login,
    register,
    logout,
    refreshUser,
  };
}
