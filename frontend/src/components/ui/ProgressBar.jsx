import { cn } from '../../utils/cn';

const TONES = {
  brand: 'from-brand-500 to-accent-500',
  green: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  blue: 'from-blue-500 to-cyan-500',
};

export default function ProgressBar({ value = 0, tone = 'brand', className, showLabel = false }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', TONES[tone] ?? TONES.brand)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
