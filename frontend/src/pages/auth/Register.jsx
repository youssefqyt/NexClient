import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = await authService.register(form);
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success('Welcome to NexClient!');
      navigate('/client/dashboard', { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start managing clients and projects in minutes"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          name="name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="Use 8 or more characters with a mix of letters and numbers."
          required
        />
        <Input
          label="Confirm password"
          name="password_confirmation"
          type="password"
          placeholder="Repeat your password"
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          required
        />

        <Button type="submit" variant="gradient" className="w-full" loading={loading}>
          Create account
        </Button>

        <p className="text-center text-xs text-slate-400">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
