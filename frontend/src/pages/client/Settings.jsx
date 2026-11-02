import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Monitor, Save } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { authService } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function ClientSettings() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await authService.updatePassword(form);
      toast.success('Password updated');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your appearance, language and account security.
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" subtitle="Make NexClient feel like home." />
        <div className="flex flex-wrap items-center gap-3">
          {[
            { value: 'light', label: 'Light', icon: Monitor },
            { value: 'dark', label: 'Dark', icon: Monitor },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <option.icon size={16} />
              {option.label}
              {theme === option.value && <Badge tone="brand">Active</Badge>}
            </button>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader title="Language & region" subtitle="Choose the language for your workspace." />
        <LanguageSwitcher />
      </Card>

      {/* Password */}
      <Card>
        <CardHeader title="Password" subtitle="Use at least 8 characters." />
        <form onSubmit={submit} className="max-w-md space-y-4">
          <Input
            label="Current password"
            type="password"
            value={form.current_password}
            onChange={set('current_password')}
            error={errors.current_password}
            required
          />
          <Input
            label="New password"
            type="password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
            required
          />
          <Button type="submit" loading={saving}>
            <KeyRound size={15} /> Update password
          </Button>
        </form>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader title="Session" subtitle="Sign out of your account on this device." />
        <Button variant="secondary" onClick={logout}>
          <Save size={15} /> Sign out
        </Button>
      </Card>
    </div>
  );
}
