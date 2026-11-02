import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const PLANS = [
  {
    name: 'Starter',
    price: 0,
    tagline: 'For freelancers finding their feet',
    features: ['1 workspace', 'Up to 5 clients', 'Projects & tasks', 'Basic invoicing', 'Email support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Agency Pro',
    price: 49,
    tagline: 'For growing digital agencies',
    features: [
      'Unlimited clients & projects',
      'Kanban board & milestones',
      'AI assistant included',
      'Invoices + PDF export',
      'Support desk with replies',
      'Analytics dashboard',
      'CSV exports',
    ],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 129,
    tagline: 'For multi-team operations',
    features: [
      'Everything in Agency Pro',
      'Manager & team roles',
      'Activity audit log',
      'Blog & site settings',
      'Custom branding',
      'Priority support',
    ],
    cta: 'Talk to sales',
    highlight: false,
  },
];

const COMPARISON = [
  ['Clients', '5', 'Unlimited', 'Unlimited'],
  ['Projects', '3', 'Unlimited', 'Unlimited'],
  ['Kanban & milestones', '—', '✓', '✓'],
  ['AI assistant', '—', '✓', '✓'],
  ['PDF invoices', '✓', '✓', '✓'],
  ['Support desk', '—', '✓', '✓'],
  ['Analytics', '—', '✓', '✓'],
  ['Manager roles', '—', '—', '✓'],
  ['Audit log', '—', '—', '✓'],
];

const FAQS = [
  { q: 'Can I change plans later?', a: 'Yes — upgrade or downgrade at any time. Changes are prorated automatically.' },
  { q: 'What happens after the trial?', a: 'Your account moves to the Starter plan unless you choose a paid plan. Nothing is deleted.' },
  { q: 'Do you offer annual billing?', a: 'Yes, annual billing saves two months. Toggle it on at checkout.' },
  { q: 'Is there a discount for non-profits?', a: 'We offer 40% off for registered non-profits and educational institutions. Contact us to apply.' },
];

export default function Pricing() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Plans that scale with your studio
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Every plan includes unlimited invoices, secure authentication and a 14-day free trial.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
              plan.highlight
                ? 'border-brand-500 bg-white shadow-card dark:bg-slate-900'
                : 'border-slate-200 bg-white shadow-soft hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/70'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
            <p className="mt-6">
              <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ${plan.price}
              </span>
              <span className="text-sm text-slate-400"> /month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button to="/register" variant={plan.highlight ? 'gradient' : 'secondary'} className="mt-7 w-full">
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>

      <Card className="mt-16 overflow-hidden" padded={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Feature
                </th>
                {['Starter', 'Agency Pro', 'Scale'].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {COMPARISON.map(([label, ...values]) => (
                <tr key={label}>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</td>
                  {values.map((value, i) => (
                    <td
                      key={`${label}-${i}`}
                      className={`px-5 py-3 text-center text-sm ${
                        value === '✓' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        {FAQS.map((faq) => (
          <Card key={faq.q} hover>
            <div className="flex gap-3">
              <HelpCircle size={18} className="mt-0.5 shrink-0 text-brand-500" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
