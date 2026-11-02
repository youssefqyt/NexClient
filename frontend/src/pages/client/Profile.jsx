import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Building2, Mail, Save, Upload } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { authService } from '../../services/authService';
import { updateUser } from '../../store/slices/authSlice';
import { LANGUAGES, TIMEZONES } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function ClientProfile() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(null);

  useEffect(() => {
    authService
      .getProfile()
      .then((res) => {
        const u = res?.user ?? res?.data?.user ?? res;
        setProfile(u);
        setForm({
          name: u?.name ?? '',
          phone: u?.phone ?? '',
          bio: u?.bio ?? '',
          timezone: u?.timezone ?? 'UTC',
          language: u?.language ?? 'en',
          first_name: u?.client?.first_name ?? '',
          last_name: u?.client?.last_name ?? '',
          position: u?.client?.position ?? '',
          address: u?.client?.address ?? '',
          city: u?.client?.city ?? '',
          state: u?.client?.state ?? '',
          country: u?.client?.country ?? '',
          postal_code: u?.client?.postal_code ?? '',
        });
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await authService.updateMe(form);
      const u = res?.user ?? res?.data?.user ?? res;
      setProfile(u);
      dispatch(updateUser(u));
      toast.success('Profile updated');
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('avatar', file);
      const res = await authService.updateProfile(body);
      const u = res?.user ?? res?.data?.user ?? res;
      setProfile((prev) => ({ ...prev, avatar_url: u.avatar_url }));
      dispatch(updateUser(u));
      toast.success('Photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  if (loading || !form) return <PageLoader label="Loading profile…" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Keep your contact details up to date so we can reach you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={profile?.name} src={profile?.avatar_url} size={96} />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{profile?.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
            <div className="mt-3">
              <Badge tone={profile?.role === 'admin' ? 'violet' : profile?.role === 'manager' ? 'blue' : 'green'}>
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Member'}
              </Badge>
            </div>

            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Upload size={15} />
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm dark:border-slate-800">
            <p className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Mail size={14} /> {profile?.email}
            </p>
            {profile?.client?.company?.name && (
              <p className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Building2 size={14} /> {profile.client.company.name}
              </p>
            )}
            <p className="text-xs text-slate-400">Member since {formatDate(profile?.created_at)}</p>
          </div>
        </Card>

        {/* Editable form */}
        <Card className="lg:col-span-2">
          <CardHeader title="Personal details" subtitle="Update your information and preferences." />
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
            </div>

            {profile?.role === 'client' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="First name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
                  <Input label="Last name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Position" value={form.position} onChange={set('position')} error={errors.position} />
                  <Input label="Address" value={form.address} onChange={set('address')} error={errors.address} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="City" value={form.city} onChange={set('city')} />
                  <Input label="State" value={form.state} onChange={set('state')} />
                  <Input label="Postal code" value={form.postal_code} onChange={set('postal_code')} />
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                  <Input label="Country" value={form.country} onChange={set('country')} />
                </div>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Timezone" value={form.timezone} onChange={set('timezone')}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
              <Select label="Language" value={form.language} onChange={set('language')}>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea label="Bio" rows={3} value={form.bio} onChange={set('bio')} error={errors.bio} />

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <Save size={15} /> Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
