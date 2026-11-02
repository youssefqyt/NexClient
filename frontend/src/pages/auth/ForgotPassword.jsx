import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent — check your inbox');
    } catch (error) {
      // Always show a neutral message so we never reveal whether an email exists.
      setSent(true);
      toast.success('If that email exists, a reset link is on its way');
      console.warn(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll email you a secure link to choose a new password"
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
          <MailCheck className="mx-auto text-emerald-600 dark:text-emerald-400" size={28} />
          <h2 className="mt-3 font-semibold text-emerald-800 dark:text-emerald-300">Check your email</h2>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-400/80">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <p className="mt-3 text-xs text-emerald-700/70 dark:text-emerald-400/70">
            Local dev tip: emails are written to <code>backend/storage/logs/laravel.log</code> because the
            mailer is set to <code>log</code>.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="gradient" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
