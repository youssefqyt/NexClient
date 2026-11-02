import { cn } from '../../utils/cn';

export default function Spinner({ className, size = 20 }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-brand-500 border-t-transparent',
        className
      )}
    />
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Spinner size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
