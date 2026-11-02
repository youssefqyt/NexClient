import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    token: params.get('token') ?? '',
    email: params.get('email') ?? '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await authService.resetPassword(form);
      toast.success('Password reset — please sign in');
      navigate('/login', { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Set a strong password to secure your account"
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          label="Reset token"
          name="token"
          value={form.token}
          onChange={set('token')}
          error={errors.token}
          hint="Filled automatically from the reset link."
          required
        />
        <Input
          label="New password"
          name="password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <Input
          label="Confirm new password"
          name="password_confirmation"
          type="password"
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          required
        />
        <Button type="submit" variant="gradient" className="w-full" loading={loading}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
