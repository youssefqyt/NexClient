import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { settingService } from '../../services/contentService';
import { CURRENCIES, LANGUAGES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/errors';

const GROUP_LABELS = {
  general: 'General',
  appearance: 'Appearance',
  financial: 'Financial',
  contact: 'Contact',
  social: 'Social',
  seo: 'SEO',
};

// Human-friendly labels + input types for the known setting keys.
const FIELDS = {
  site_name: { label: 'Site name' },
  site_tagline: { label: 'Tagline' },
  site_description: { label: 'Site description', type: 'textarea' },
  primary_color: { label: 'Primary color', type: 'color' },
  secondary_color: { label: 'Secondary color', type: 'color' },
  currency: { label: 'Currency', options: CURRENCIES },
  tax_rate: { label: 'Default tax rate (%)', type: 'number' },
  items_per_page: { label: 'Items per page', type: 'number' },
  default_locale: { label: 'Default language', options: LANGUAGES.map((l) => l.code) },
  contact_email: { label: 'Contact email', type: 'email' },
  contact_phone: { label: 'Contact phone' },
  social_twitter: { label: 'Twitter / X URL' },
  social_linkedin: { label: 'LinkedIn URL' },
  social_facebook: { label: 'Facebook URL' },
  social_instagram: { label: 'Instagram URL' },
  seo_title: { label: 'SEO title' },
  seo_description: { label: 'SEO description', type: 'textarea' },
  seo_keywords: { label: 'SEO keywords' },
};

const prettyKey = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Settings() {
  const [groups, setGroups] = useState(null);
  const [values, setValues] = useState({});
  const [active, setActive] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingService
      .getAll()
      .then(({ data }) => {
        setGroups(data);
        const flat = {};
        Object.values(data).flat().forEach((setting) => {
          flat[setting.key] = setting.value ?? '';
        });
        setValues(flat);
        const first = Object.keys(data)[0];
        if (first) setActive(first);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const tabs = useMemo(
    () => (groups ? Object.keys(groups).map((key) => ({ key, label: GROUP_LABELS[key] ?? prettyKey(key) })) : []),
    [groups]
  );

  const save = async () => {
    setSaving(true);
    try {
      await settingService.bulkUpdate(values);
      toast.success('Settings saved');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
      </div>
    );
  }

  const activeSettings = groups?.[active] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure your workspace, branding and public site content.
          </p>
        </div>
        <Button onClick={save} loading={saving}>
          <Save size={15} /> Save changes
        </Button>
      </div>

      <Tabs tabs={tabs} active={active} onChange={setActive} />

      <Card>
        <CardHeader
          title={GROUP_LABELS[active] ?? prettyKey(active)}
          subtitle="These values are used across the dashboard and the marketing site."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {activeSettings.map((setting) => {
            const field = FIELDS[setting.key] ?? {};
            const value = values[setting.key] ?? '';
            const onChange = (val) => setValues((prev) => ({ ...prev, [setting.key]: val }));

            if (field.type === 'color') {
              return (
                <div key={setting.key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {field.label ?? prettyKey(setting.key)}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value || '#000000'}
                      onChange={(e) => onChange(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    />
                    <Input value={value} onChange={(e) => onChange(e.target.value)} />
                  </div>
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <Input
                  key={setting.key}
                  label={field.label ?? prettyKey(setting.key)}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  containerClassName="sm:col-span-2"
                />
              );
            }

            if (field.options) {
              return (
                <Select
                  key={setting.key}
                  label={field.label ?? prettyKey(setting.key)}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                >
                  <option value="">Select…</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              );
            }

            return (
              <Input
                key={setting.key}
                label={field.label ?? prettyKey(setting.key)}
                type={field.type ?? 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} loading={saving}>
            <Save size={15} /> Save changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
