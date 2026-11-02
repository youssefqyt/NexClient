import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageLoader } from '../components/ui/Spinner';

/** Requires an authenticated session. */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useSelector((s) => s.auth);
  const location = useLocation();

  if (initializing) return <PageLoader label="Preparing your workspace…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
