import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-brand-600 shadow-card dark:bg-slate-900 dark:text-brand-400">
        <SearchX size={34} />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        We couldn’t find that page
      </h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">
        The link may be broken or the page may have been moved. Let’s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/" variant="gradient">
          <Home size={16} /> Back to home
        </Button>
        <Button to="/contact" variant="secondary">
          Contact support
        </Button>
      </div>
      <p className="mt-10 text-xs text-slate-400">
        Looking for your workspace? <Link to="/login" className="font-medium text-brand-600">Sign in</Link>
      </p>
    </div>
  );
}
