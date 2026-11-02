import { Menu, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toggleSidebar, toggleAiPanel } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { flatNav } from './navItems';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import ThemeToggle from '../ui/ThemeToggle';

export default function Topbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { role } = useAuth();

  // Longest matching nav prefix gives the current section title.
  const match = flatNav(role)
    .filter((item) => location.pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 dark:border-slate-800 dark:bg-slate-950/85">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {match?.label ?? 'Dashboard'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch(toggleAiPanel())}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
