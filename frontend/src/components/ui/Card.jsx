import { cn } from '../../utils/cn';

/**
 * Surface container. Use `hover` for the signature card-lift interaction used
 * across dashboards and the marketing site.
 */
export default function Card({
  className,
  children,
  hover = false,
  padded = true,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-soft',
        'dark:border-slate-800 dark:bg-slate-900/70 dark:backdrop-blur',
        padded && 'p-5 sm:p-6',
        hover &&
          'transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card dark:hover:border-brand-800',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
