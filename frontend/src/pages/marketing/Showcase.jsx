import { motion } from 'framer-motion';
import { ArrowRight, Quote } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const CASE_STUDIES = [
  {
    client: 'Northlight Studio',
    industry: 'Branding agency · 12 people',
    title: 'Cut weekly reporting from 6 hours to 20 minutes',
    summary:
      'Northlight moved every client project into NexClient and used the AI assistant to draft weekly status updates automatically.',
    metrics: [
      { label: 'Time saved / week', value: '5h 40m' },
      { label: 'On-time delivery', value: '+34%' },
    ],
    tags: ['Branding', 'AI updates', 'Reporting'],
  },
  {
    client: 'Kite Digital',
    industry: 'Web development · 28 people',
    title: 'One source of truth for 40 concurrent projects',
    summary:
      'Kanban boards and milestones gave every squad a shared view, while invoices finally matched delivery milestones.',
    metrics: [
      { label: 'Active projects', value: '40' },
      { label: 'Invoice disputes', value: '−92%' },
    ],
    tags: ['Web', 'Kanban', 'Invoicing'],
  },
  {
    client: 'Atelier Nord',
    industry: 'Design consultancy · 6 people',
    title: 'A client portal that sold the next retainer',
    summary:
      'Clients can track progress and download invoices themselves — freeing the team to focus on the actual work.',
    metrics: [
      { label: 'Support tickets', value: '−58%' },
      { label: 'Retainer renewal', value: '100%' },
    ],
    tags: ['Consulting', 'Client portal'],
  },
  {
    client: 'Bright & Co',
    industry: 'Performance marketing · 15 people',
    title: 'From spreadsheets to a real revenue dashboard',
    summary:
      'Live analytics surfaced overdue invoices within days, unlocking cash flow the team did not know was stuck.',
    metrics: [
      { label: 'Overdue invoices', value: '−71%' },
      { label: 'Cash recovered', value: '$38k' },
    ],
    tags: ['Marketing', 'Analytics', 'Cash flow'],
  },
];

export default function Showcase() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Showcase
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Real teams, real results
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          A look at how freelancers and agencies run their client work on NexClient.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {CASE_STUDIES.map((study, i) => (
          <motion.div
            key={study.client}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 2) * 0.1 }}
          >
            <Card hover className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{study.client}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{study.industry}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Quote size={18} />
                </span>
              </div>

              <h3 className="mt-5 font-semibold text-slate-800 dark:text-slate-100">{study.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {study.summary}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                {study.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{metric.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-4xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 px-8 py-12 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="text-2xl font-bold text-white">Want your project featured here?</h2>
          <p className="mt-2 text-white/80">
            Start your free trial and tell us how NexClient changed your workflow.
          </p>
        </div>
        <Button to="/register" size="lg" className="bg-white text-brand-700 hover:bg-slate-100">
          Get started <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}
