import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/** Keeps signed-in users away from the login/register screens. */
export default function GuestRoute() {
  const { isAuthenticated, user, initializing } = useSelector((s) => s.auth);

  if (initializing) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'client' ? '/client/dashboard' : '/admin/dashboard'} replace />;
  }

  return <Outlet />;
}
