import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Avatar from '../../components/ui/Avatar';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import TaskModal from '../../components/kanban/TaskModal';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { PRIORITY, TASK_STATUS, metaFor, toOptions } from '../../utils/constants';
import { formatDate, isOverdue, paginate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

export default function Tasks() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState([]);
  const [modal, setModal] = useState({ open: false, task: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await taskService.getAll({
        page,
        per_page: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        project_id: projectId || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, priority, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, projectId]);

  useEffect(() => {
    projectService.getAll({ per_page: 200 }).then(({ data }) => setProjects(data.data ?? [])).catch(() => {});
  }, []);

  const remove = async () => {
    setDeleting(true);
    try {
      await taskService.delete(confirm.id);
      toast.success('Task deleted');
      setConfirm({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Task',
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.title}</p>
            <p className="truncate text-xs text-slate-400">{row.project?.title ?? '—'}</p>
          </div>
        ),
      },
      {
        key: 'assigned_user',
        header: 'Assignee',
        render: (row) =>
          row.assigned_user ? (
            <span className="inline-flex items-center gap-2">
              <Avatar name={row.assigned_user.name} src={row.assigned_user.avatar_url} size={26} />
              <span className="text-sm">{row.assigned_user.name}</span>
            </span>
          ) : (
            <span className="text-slate-400">Unassigned</span>
          ),
      },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge meta={metaFor(TASK_STATUS, row.status)} /> },
      { key: 'priority', header: 'Priority', render: (row) => <StatusBadge meta={metaFor(PRIORITY, row.priority)} /> },
      {
        key: 'due_date',
        header: 'Due',
        render: (row) =>
          row.due_date ? (
            <span className={isOverdue(row.due_date, row.status === 'done') ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
              {formatDate(row.due_date)}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'labels',
        header: 'Labels',
        render: (row) =>
          row.labels?.length ? (
            <div className="flex flex-wrap gap-1">
              {row.labels.slice(0, 2).map((label) => (
                <Badge key={label} tone="brand" className="!text-[10px]">
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'text-right',
        className: 'text-right',
        render: (row) => (
          <div className="flex justify-end">
            <Dropdown
              trigger={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <MoreHorizontal size={16} />
                </span>
              }
              items={[
                { label: 'Edit', icon: Pencil, onClick: () => setModal({ open: true, task: row }) },
                { divider: true },
                { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm({ open: true, id: row.id }) },
              ]}
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Tasks"
          subtitle="Every task across all projects in one list"
          action={
            <Button size="sm" onClick={() => setModal({ open: true, task: null })}>
              <Plus size={15} /> New task
            </Button>
          }
        />

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" className="lg:max-w-xs" />
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} containerClassName="lg:max-w-[220px]" aria-label="Filter by project">
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="lg:max-w-[160px]" aria-label="Filter by status">
            <option value="">All statuses</option>
            {toOptions(TASK_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} containerClassName="lg:max-w-[160px]" aria-label="Filter by priority">
            <option value="">All priorities</option>
            {toOptions(PRIORITY).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          rows={rows}
          loading={loading}
          empty={
            <div className="py-14 text-center">
              <CheckSquare className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No tasks found</p>
              <p className="mt-1 text-sm text-slate-400">Create a task to get started.</p>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        projects={projects}
        onSaved={load}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this task?"
        message="This cannot be undone."
        confirmLabel="Delete task"
      />
    </div>
  );
}
