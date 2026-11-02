import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Pagination({ meta, onPageChange, className }) {
  if (!meta || meta.lastPage <= 1) return null;

  const { currentPage, lastPage, from, to, total } = meta;

  // Windowed page numbers with ellipsis for large result sets.
  const pages = [];
  const push = (p) => !pages.includes(p) && pages.push(p);
  push(1);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p > 1 && p < lastPage) push(p);
  }
  if (lastPage > 1) push(lastPage);

  const ordered = [...new Set(pages)].sort((a, b) => a - b);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-4 sm:flex-row', className)}>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{from}</span>–
        <span className="font-medium text-slate-700 dark:text-slate-300">{to}</span> of{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {ordered.map((page, i) => (
          <span key={page} className="flex items-center">
            {i > 0 && ordered[i - 1] !== page - 1 && (
              <span className="px-1 text-slate-400">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {page}
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
