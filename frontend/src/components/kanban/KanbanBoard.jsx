import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { TASK_COLUMNS, TASK_STATUS, metaFor } from '../../utils/constants';
import { cn } from '../../utils/cn';

const COLUMN_TONES = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-500',
  review: 'border-t-violet-500',
  done: 'border-t-emerald-500',
};

/**
 * Dependency-free Kanban board using the HTML5 drag-and-drop API.
 * `onReorder(payload)` receives `[{ id, order, status }]` ready for the API.
 */
export default function KanbanBoard({ tasks = [], onOpenTask, onAddTask, onReorder, className }) {
  const [items, setItems] = useState(tasks);
  const dragging = useRef(null);
  const [overColumn, setOverColumn] = useState(null);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const columns = TASK_COLUMNS.map((key) => ({
    key,
    meta: metaFor(TASK_STATUS, key),
    tasks: items
      .filter((task) => (task.status ?? 'todo') === key)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));

  /** Persist a fully rebuilt list, numbering `order` per column. */
  const commit = (next) => {
    setItems(next);

    const counters = {};
    const payload = next.map((task) => {
      const column = task.status ?? 'todo';
      counters[column] = (counters[column] ?? 0) + 1;
      return { id: task.id, order: counters[column], status: column };
    });
    onReorder?.(payload);
  };

  const handleDrop = (columnKey, beforeId = null) => {
    const dragged = dragging.current;
    dragging.current = null;
    setOverColumn(null);
    if (!dragged) return;

    const moving = items.find((task) => task.id === dragged);
    if (!moving) return;

    const rest = items.filter((task) => task.id !== dragged);
    const updated = { ...moving, status: columnKey };

    if (beforeId) {
      const index = rest.findIndex((task) => task.id === beforeId);
      rest.splice(index === -1 ? rest.length : index, 0, updated);
    } else {
      const lastIndex = rest.map((t) => t.status).lastIndexOf(columnKey);
      if (lastIndex === -1) rest.push(updated);
      else rest.splice(lastIndex + 1, 0, updated);
    }

    commit(rest);
  };

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {columns.map((column) => (
        <section
          key={column.key}
          onDragOver={(e) => {
            e.preventDefault();
            setOverColumn(column.key);
          }}
          onDragLeave={() => setOverColumn((c) => (c === column.key ? null : c))}
          onDrop={() => handleDrop(column.key)}
          className={cn(
            'flex flex-col rounded-2xl border border-slate-200 border-t-4 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40',
            COLUMN_TONES[column.key],
            overColumn === column.key && 'ring-2 ring-brand-400/60'
          )}
        >
          <header className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {column.meta.label}
              </h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {column.tasks.length}
              </span>
            </div>
            {onAddTask && (
              <button
                type="button"
                onClick={() => onAddTask(column.key)}
                aria-label={`Add task to ${column.meta.label}`}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-brand-600 dark:hover:bg-slate-800"
              >
                <Plus size={16} />
              </button>
            )}
          </header>

          <div className="flex flex-1 flex-col gap-2.5">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(column.key, task.id);
                }}
              >
                <TaskCard
                  task={task}
                  onOpen={onOpenTask}
                  onDragStart={() => {
                    dragging.current = task.id;
                  }}
                />
              </div>
            ))}

            {!column.tasks.length && (
              <button
                type="button"
                onClick={() => onAddTask?.(column.key)}
                className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-800"
              >
                Drop tasks here
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
