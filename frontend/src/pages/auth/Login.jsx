import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

const DEMO = [
  { role: 'Admin', email: 'admin@nexclient.com' },
  { role: 'Manager', email: 'manager@nexclient.com' },
  { role: 'Client', email: 'client@nexclient.com' },
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = await authService.login(form.email, form.password, form.remember);
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);

      const from = location.state?.from;
      const fallback = data.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard';
      navigate(from ?? fallback, { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email) => setForm({ email, password: 'password', remember: true });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your NexClient workspace"
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={set('remember')}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600"
          >
            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <Button type="submit" variant="gradient" className="w-full" loading={loading}>
          Sign in
        </Button>

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Demo accounts — click to fill
        </p>
        <div className="mt-3 grid gap-2">
          {DEMO.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => quickFill(account.email)}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="font-medium text-slate-700 dark:text-slate-200">{account.role}</span>
              <span className="text-xs text-slate-400">{account.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Password for all demo accounts: password</p>
      </div>
    </AuthShell>
  );
}
