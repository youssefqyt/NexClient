import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageLoader } from '../components/ui/Spinner';

/** Restricts a branch of routes to specific roles. */
export default function RoleRoute({ roles = [] }) {
  const { user, isAuthenticated, initializing } = useSelector((s) => s.auth);

  if (initializing) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles.length && !roles.includes(user?.role)) {
    // Send users to the portal that matches their role.
    const fallback = user?.role === 'client' ? '/client/dashboard' : '/admin/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
