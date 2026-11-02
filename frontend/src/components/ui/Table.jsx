import { cn } from '../../utils/cn';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Generic data table.
 * columns: [{ key, header, render(row), className, headerClassName }]
 */
export default function Table({
  columns,
  rows = [],
  loading = false,
  empty,
  rowKey = (row) => row.id,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  className,
}) {
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds.includes(rowKey(r)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rows.map(rowKey));
  };

  const toggleOne = (id) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  if (loading) {
    return (
      <div className={cn('py-2', className)}>
        <TableSkeleton cols={columns.length} />
      </div>
    );
  }

  if (!rows.length) {
    return empty ?? <EmptyState title="No records found" description="Try adjusting your filters." />;
  }

  return (
    <div className={cn('-mx-5 overflow-x-auto sm:-mx-6', className)}>
      <div className="inline-block min-w-full px-5 align-middle sm:px-6">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10 py-3 pl-1 pr-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              const id = rowKey(row);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    selectedIds.includes(id) && 'bg-brand-50/60 dark:bg-brand-950/20'
                  )}
                >
                  {selectable && (
                    <td className="py-3 pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleOne(id)}
                        aria-label="Select row"
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap py-3.5 pr-4 text-sm text-slate-700 dark:text-slate-300',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
