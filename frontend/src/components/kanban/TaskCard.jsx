import { CalendarDays, MessageSquare, Paperclip } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge, { StatusBadge } from '../ui/Badge';
import { PRIORITY, metaFor } from '../../utils/constants';
import { formatDate, isOverdue } from '../../utils/format';
import { cn } from '../../utils/cn';

/** Compact task tile used on the Kanban board. */
export default function TaskCard({ task, onOpen, draggable = true, onDragStart }) {
  const overdue = isOverdue(task.due_date, task.status === 'done');
  const labels = task.labels ?? [];

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onClick={() => onOpen?.(task)}
      className={cn(
        'group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft transition-all',
        'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card',
        'dark:border-slate-800 dark:bg-slate-900',
        draggable && 'active:cursor-grabbing'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
          {task.title}
        </p>
        <StatusBadge meta={metaFor(PRIORITY, task.priority)} />
      </div>

      {labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <Badge key={label} tone="brand" className="!px-2 !py-0 !text-[10px]">
              {label}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {task.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                overdue && 'font-medium text-rose-600 dark:text-rose-400'
              )}
            >
              <CalendarDays size={13} /> {formatDate(task.due_date, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.comments_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={13} /> {task.comments_count}
            </span>
          )}
          {task.attachments_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={13} /> {task.attachments_count}
            </span>
          )}
        </div>

        {task.assigned_user ? (
          <Avatar name={task.assigned_user.name} src={task.assigned_user.avatar_url} size={26} />
        ) : (
          <span className="h-6 w-6 rounded-full border border-dashed border-slate-300 dark:border-slate-700" />
        )}
      </div>
    </article>
  );
}
