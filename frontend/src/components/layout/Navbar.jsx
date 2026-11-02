import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Menu, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

const links = [
  { to: '/', labelKey: 'nav.features', hash: '#features' },
  { to: '/pricing', labelKey: 'nav.pricing' },
  { to: '/showcase', labelKey: 'nav.showcase' },
  { to: '/blog', labelKey: 'nav.blog' },
  { to: '/contact', labelKey: 'nav.contact' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isClient } = useAuth();
  const location = useLocation();

  const dashboardPath = isClient ? '/client/dashboard' : '/admin/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft transition-transform group-hover:scale-105">
            <Sparkles size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Nex<span className="text-gradient">Client</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'group relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive && location.hash !== '#features'
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                )
              }
            >
              {t(link.labelKey)}
              <span className="absolute inset-x-3.5 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-brand-500 transition-transform duration-300 group-hover:scale-x-100" />
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <Button to={dashboardPath} size="sm">
              <LayoutDashboard size={16} />
              {t('nav.dashboard')}
            </Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                {t('nav.login')}
              </Button>
              <Button to="/register" variant="gradient" size="sm">
                {t('nav.register')}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="!mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <LanguageSwitcher className="w-full [&>select]:w-full" />
                {isAuthenticated ? (
                  <Button to={dashboardPath} onClick={() => setOpen(false)}>
                    <LayoutDashboard size={16} />
                    {t('nav.dashboard')}
                  </Button>
                ) : (
                  <>
                    <Button to="/login" variant="secondary" onClick={() => setOpen(false)}>
                      {t('nav.login')}
                    </Button>
                    <Button to="/register" variant="gradient" onClick={() => setOpen(false)}>
                      {t('nav.register')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
