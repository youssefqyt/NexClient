import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

const HIGHLIGHTS = [
  'AI summaries, status updates & message drafting',
  'Clients, projects, tasks and Kanban in one place',
  'Invoices with PDF export and payment tracking',
  'Support tickets with near-real-time replies',
];

/** Shared two-panel shell for login / register / password screens. */
export default function AuthShell({ title, subtitle, children, footer, backTo = '/' }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Marketing side panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">NexClient</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Run your entire agency from one calm, intelligent workspace.
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} NexClient. All rights reserved.
        </p>
      </aside>

      {/* Form side */}
      <main className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <Link
            to={backTo}
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft size={15} /> Back to home
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
