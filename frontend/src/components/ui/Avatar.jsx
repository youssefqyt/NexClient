import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

export default function Avatar({ name = '', src, size = 36, className, ring = false }) {
  const dimension = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className={cn(
          'shrink-0 rounded-full object-cover',
          ring && 'ring-2 ring-white dark:ring-slate-900',
          className
        )}
      />
    );
  }

  return (
    <span
      style={{ ...dimension, fontSize: size * 0.38 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-semibold text-white',
        ring && 'ring-2 ring-white dark:ring-slate-900',
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
