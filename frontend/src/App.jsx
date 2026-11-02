import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './router/ProtectedRoute';
import RoleRoute from './router/RoleRoute';
import GuestRoute from './router/GuestRoute';

import Landing from './pages/marketing/Landing';
import Pricing from './pages/marketing/Pricing';
import Showcase from './pages/marketing/Showcase';
import Blog from './pages/marketing/Blog';
import BlogPost from './pages/marketing/BlogPost';
import Contact from './pages/marketing/Contact';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import AdminDashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import Clients from './pages/admin/Clients';
import ClientDetail from './pages/admin/ClientDetail';
import Projects from './pages/admin/Projects';
import Tasks from './pages/admin/Tasks';
import Users from './pages/admin/Users';
import AdminBlog from './pages/admin/Blog';
import Messages from './pages/admin/Messages';
import Activity from './pages/admin/Activity';
import AdminSettings from './pages/admin/Settings';

import ClientDashboard from './pages/client/Dashboard';
import ClientProjects from './pages/client/Projects';
import ClientProfile from './pages/client/Profile';
import ClientSettings from './pages/client/Settings';

import ProjectDetail from './pages/shared/ProjectDetail';
import Invoices from './pages/shared/Invoices';
import InvoiceDetail from './pages/shared/InvoiceDetail';
import Tickets from './pages/shared/Tickets';
import TicketDetail from './pages/shared/TicketDetail';

import NotFound from './pages/NotFound';
import { authService } from './services/authService';
import { finishInitializing, setCredentials, logout } from './store/slices/authSlice';

/** Restores the session from a stored token on first paint. */
function useBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(finishInitializing());
      return;
    }

    authService
      .getMe()
      .then((user) => dispatch(setCredentials({ user, token })))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(logout());
      })
      .finally(() => dispatch(finishInitializing()));
  }, [dispatch]);
}

/** Reset scroll position on navigation. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
}

/** Redirects /dashboard to role-appropriate sub-dashboard */
function DashboardRedirect() {
  const { user } = useSelector((s) => s.auth);
  const actualUser = user?.user ?? user;
  const destination = actualUser?.role === 'client' ? '/client/dashboard' : '/admin/dashboard';
  return <Navigate to={destination} replace />;
}

export default function App() {
  useBootstrap();

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public marketing site */}
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="showcase" element={<Showcase />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        {/* Auth screens (guests only) */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Authenticated app */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Generic /dashboard redirect */}
            <Route path="dashboard" element={<DashboardRedirect />} />

            {/* Admin + manager */}
            <Route path="admin" element={<RoleRoute roles={['admin', 'manager']} />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="messages" element={<Messages />} />
              <Route path="activity" element={<Activity />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Client portal */}
            <Route path="client" element={<RoleRoute roles={['client']} />}>
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="projects" element={<ClientProjects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}
