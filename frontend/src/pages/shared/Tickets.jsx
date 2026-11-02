import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, LifeBuoy, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import {
  PRIORITY,
  TICKET_CATEGORY,
  TICKET_STATUS,
  metaFor,
  toOptions,
} from '../../utils/constants';
import { formatDate, paginate } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const EMPTY = { subject: '', description: '', category: 'general', priority: 'medium' };

export default function Tickets() {
  const { user, isClient } = useAuth();
  const base = basePath(user);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getAll({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, category]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await ticketService.create(form);
      toast.success('Ticket created');
      setModal(false);
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
      await ticketService.delete(confirm.id);
      toast.success('Ticket deleted');
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
    exportToCsv('nexclient-tickets', rows, [
      { key: 'ticket_number', label: 'Ticket' },
      { key: 'subject', label: 'Subject' },
      { key: 'category', label: 'Category' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'messages_count', label: 'Replies' },
      { key: 'created_at', label: 'Created' },
    ]);
    toast.success('CSV exported');
  };

  const columns = useMemo(
    () => [
      {
        key: 'subject',
        header: 'Ticket',
        render: (row) => (
          <div className="min-w-0">
            <Link
              to={`${base}/tickets/${row.id}`}
              className="block truncate font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100"
            >
              {row.subject}
            </Link>
            <p className="text-xs text-slate-400">{row.ticket_number}</p>
          </div>
        ),
      },
      { key: 'category', header: 'Category', render: (row) => <Badge tone={metaFor(TICKET_CATEGORY, row.category).tone}>{metaFor(TICKET_CATEGORY, row.category).label}</Badge> },
      { key: 'priority', header: 'Priority', render: (row) => <StatusBadge meta={metaFor(PRIORITY, row.priority)} /> },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge meta={metaFor(TICKET_STATUS, row.status)} /> },
      { key: 'messages_count', header: 'Replies', render: (row) => row.messages_count ?? 0 },
      {
        key: 'created_at',
        header: 'Created',
        render: (row) => <span className="text-slate-500">{formatDate(row.created_at)}</span>,
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
                { label: 'Open', icon: Eye, onClick: () => (window.location.href = `${base}/tickets/${row.id}`) },
                ...(isClient
                  ? []
                  : [
                      { divider: true },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm({ open: true, id: row.id }) },
                    ]),
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, isClient]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Support tickets"
          subtitle={isClient ? 'Reach our team whenever you need help' : 'Triage and resolve client requests'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={15} /> Export
              </Button>
              {isClient && (
                <Button size="sm" onClick={openCreate}>
                  <Plus size={15} /> New ticket
                </Button>
              )}
            </div>
          }
        />

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tickets…"
            className="lg:max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="lg:max-w-[170px]" aria-label="Filter by status">
            <option value="">All statuses</option>
            {toOptions(TICKET_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} containerClassName="lg:max-w-[190px]" aria-label="Filter by category">
            <option value="">All categories</option>
            {toOptions(TICKET_CATEGORY).map((option) => (
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
              <LifeBuoy className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No tickets found</p>
              <p className="mt-1 text-sm text-slate-400">
                {isClient ? 'Open a ticket and we will get back to you.' : 'Nothing needs attention right now.'}
              </p>
              {isClient && (
                <Button className="mt-4" size="sm" onClick={openCreate}>
                  <Plus size={15} /> New ticket
                </Button>
              )}
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Open a support ticket"
        description="Describe your issue and we will respond shortly."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              Submit ticket
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Subject"
            value={form.subject}
            onChange={set('subject')}
            error={errors.subject}
            placeholder="Brief summary of the issue"
            required
          />
          <Textarea
            label="Description"
            rows={5}
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={form.category} onChange={set('category')} error={errors.category}>
              {toOptions(TICKET_CATEGORY).map((option) => (
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
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this ticket?"
        message="The whole conversation will be removed."
        confirmLabel="Delete ticket"
      />
    </div>
  );
}
