import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import Card from './Card';

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  trend,
  delay = 0,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card hover className={cn('relative overflow-hidden', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </p>
            {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
          </div>
          {Icon && (
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
              <Icon size={20} />
            </span>
          )}
        </div>
        {trend && (
          <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>
        )}
      </Card>
    </motion.div>
  );
}
