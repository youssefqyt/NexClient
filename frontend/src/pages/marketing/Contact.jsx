import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input, { Textarea } from '../../components/ui/Input';
import { contactService } from '../../services/contentService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

const CHANNELS = [
  { icon: Mail, label: 'Email', value: 'support@nexclient.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 010-0100' },
  { icon: MapPin, label: 'Office', value: 'Remote-first · Worldwide' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await contactService.send(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Message sent — we’ll be in touch shortly');
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Let’s talk about your agency
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Questions about pricing, onboarding or the API? Send us a note and a human will reply within one
            business day.
          </p>

          <div className="mt-10 space-y-4">
            {CHANNELS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="h-fit">
          {sent && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <MessageSquare size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Thanks! Your message is in our inbox. We usually reply within one business day.
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                name="name"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                placeholder="jane@company.com"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="Optional"
              />
              <Input
                label="Subject"
                name="subject"
                value={form.subject}
                onChange={set('subject')}
                error={errors.subject}
                placeholder="Pricing for a 5-person team"
                required
              />
            </div>

            <Textarea
              label="Message"
              name="message"
              rows={6}
              value={form.message}
              onChange={set('message')}
              error={errors.message}
              placeholder="Tell us a little about your agency and what you need…"
              required
            />

            <Button type="submit" variant="gradient" className="w-full" loading={loading}>
              <Send size={16} /> Send message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
