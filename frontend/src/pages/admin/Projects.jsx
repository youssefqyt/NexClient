import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import { CURRENCIES, PRIORITY, PROJECT_STATUS, metaFor, toOptions } from '../../utils/constants';
import { clientName, formatCurrency, formatDate, paginate } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const EMPTY = {
  title: '',
  description: '',
  client_id: '',
  budget: '',
  currency: 'USD',
  start_date: '',
  deadline: '',
  status: 'pending',
  priority: 'medium',
  progress: 0,
  member_ids: [],
};

export default function Projects() {
  const { user, isAdmin } = useAuth();
  const base = basePath(user);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);

  const [modal, setModal] = useState({ open: false, project: null });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectService.getAll({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, priority]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority]);

  useEffect(() => {
    clientService.getAll({ per_page: 200 }).then(({ data }) => setClients(data.data ?? [])).catch(() => {});
    userService.assignable().then(({ data }) => setAgents(data.users ?? [])).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleMember = (id) =>
    setForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(id)
        ? prev.member_ids.filter((m) => m !== id)
        : [...prev.member_ids, id],
    }));

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal({ open: true, project: null });
  };

  const openEdit = (project) => {
    setForm({
      title: project.title ?? '',
      description: project.description ?? '',
      client_id: String(project.client_id ?? ''),
      budget: project.budget ?? '',
      currency: project.currency ?? 'USD',
      start_date: project.start_date ? String(project.start_date).slice(0, 10) : '',
      deadline: project.deadline ? String(project.deadline).slice(0, 10) : '',
      status: project.status ?? 'pending',
      priority: project.priority ?? 'medium',
      progress: project.progress ?? 0,
      member_ids: (project.members ?? []).map((m) => m.id),
    });
    setErrors({});
    setModal({ open: true, project });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        budget: form.budget === '' ? null : Number(form.budget),
        progress: Number(form.progress),
        start_date: form.start_date || null,
        deadline: form.deadline || null,
      };
      if (modal.project) {
        await projectService.update(modal.project.id, payload);
        toast.success('Project updated');
      } else {
        await projectService.create(payload);
        toast.success('Project created');
      }
      setModal({ open: false, project: null });
      load();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await projectService.delete(confirm.id);
      toast.success('Project deleted');
      setConfirm({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error('Nothing to export');
    exportToCsv('nexclient-projects', rows, [
      { key: 'title', label: 'Project' },
      { key: 'client', label: 'Client', value: (r) => clientName(r.client) },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'progress', label: 'Progress %' },
      { key: 'budget', label: 'Budget' },
      { key: 'deadline', label: 'Deadline' },
    ]);
    toast.success('CSV exported');
  };

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Project',
        render: (row) => (
          <div className="min-w-0">
            <Link
              to={`${base}/projects/${row.id}`}
              className="block truncate font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100"
            >
              {row.title}
            </Link>
            <p className="truncate text-xs text-slate-400">{clientName(row.client)}</p>
          </div>
        ),
      },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge meta={metaFor(PROJECT_STATUS, row.status)} /> },
      { key: 'priority', header: 'Priority', render: (row) => <StatusBadge meta={metaFor(PRIORITY, row.priority)} /> },
      {
        key: 'progress',
        header: 'Progress',
        render: (row) => <ProgressBar value={row.progress} showLabel className="w-28" />,
      },
      { key: 'tasks_count', header: 'Tasks', render: (row) => row.tasks_count ?? 0 },
      {
        key: 'deadline',
        header: 'Deadline',
        render: (row) => <span className="text-slate-500">{formatDate(row.deadline)}</span>,
      },
      { key: 'budget', header: 'Budget', render: (row) => formatCurrency(row.budget, row.currency) },
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
                { label: 'Open board', icon: Eye, onClick: () => (window.location.href = `${base}/projects/${row.id}`) },
                { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                ...(isAdmin
                  ? [
                      { divider: true },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm({ open: true, id: row.id }) },
                    ]
                  : []),
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, isAdmin]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Projects"
          subtitle="Deliver client work from kickoff to completion"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={15} /> Export
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus size={15} /> New project
              </Button>
            </div>
          }
        />

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" className="lg:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="lg:max-w-[180px]" aria-label="Filter by status">
            <option value="">All statuses</option>
            {toOptions(PROJECT_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} containerClassName="lg:max-w-[180px]" aria-label="Filter by priority">
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
              <FolderKanban className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No projects found</p>
              <p className="mt-1 text-sm text-slate-400">Create a project to start delivering.</p>
              <Button className="mt-4" size="sm" onClick={openCreate}>
                <Plus size={15} /> New project
              </Button>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, project: null })}
        size="lg"
        title={modal.project ? 'Edit project' : 'New project'}
        description="Set the scope, budget and delivery window."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, project: null })}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {modal.project ? 'Save changes' : 'Create project'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={set('title')} error={errors.title} required />
          <Textarea label="Description" rows={3} value={form.description} onChange={set('description')} />

          <Select label="Client" value={form.client_id} onChange={set('client_id')} error={errors.client_id} required>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Budget" type="number" min="0" step="0.01" value={form.budget} onChange={set('budget')} error={errors.budget} />
            <Select label="Currency" value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <Input label="Progress (%)" type="number" min="0" max="100" value={form.progress} onChange={set('progress')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start date" type="date" value={form.start_date} onChange={set('start_date')} error={errors.start_date} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} error={errors.deadline} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={form.status} onChange={set('status')}>
              {toOptions(PROJECT_STATUS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select label="Priority" value={form.priority} onChange={set('priority')}>
              {toOptions(PRIORITY).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Team members</p>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => {
                const active = form.member_ids.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleMember(agent.id)}
                    className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
                      active
                        ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Avatar name={agent.name} src={agent.avatar_url} size={22} />
                    {agent.name}
                  </button>
                );
              })}
              {!agents.length && <p className="text-sm text-slate-400">No assignable users found.</p>}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this project?"
        message="Tasks, milestones and the board will be removed."
        confirmLabel="Delete project"
      />
    </div>
  );
}
