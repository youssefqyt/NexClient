import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Download, MoreHorizontal, Pencil, Plus, Trash2, UserPlus, Eye } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Avatar from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { clientService } from '../../services/clientService';
import { CLIENT_STATUS, toOptions } from '../../utils/constants';
import { metaFor } from '../../utils/constants';
import { formatDate, paginate } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const EMPTY = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: '',
  company_id: '',
  status: 'active',
  password: '',
};

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState({ open: false, client: null });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientService.getAll({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clientService
      .getCompanies()
      .then(({ data }) => setCompanies(data.companies ?? []))
      .catch(() => setCompanies([]));
  }, []);

  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal({ open: true, client: null });
  };

  const openEdit = (client) => {
    setForm({
      first_name: client.first_name ?? '',
      last_name: client.last_name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      position: client.position ?? '',
      company_id: client.company_id ?? '',
      status: client.status ?? 'active',
      password: '',
    });
    setErrors({});
    setModal({ open: true, client });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload = { ...form, company_id: form.company_id || null };
      if (modal.client) {
        delete payload.password;
        await clientService.update(modal.client.id, payload);
        toast.success('Client updated');
      } else {
        await clientService.create(payload);
        toast.success('Client created');
      }
      setModal({ open: false, client: null });
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
      await clientService.delete(confirm.id);
      toast.success('Client deleted');
      setConfirm({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error('Nothing to export');
      return;
    }
    exportToCsv('nexclient-clients', rows, [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company', value: (r) => r.company?.name ?? '' },
      { key: 'status', label: 'Status' },
      { key: 'projects_count', label: 'Projects' },
      { key: 'created_at', label: 'Created' },
    ]);
    toast.success('CSV exported');
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Client',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={`${row.first_name} ${row.last_name}`} src={row.user?.avatar_url} size={36} />
            <div className="min-w-0">
              <Link
                to={`/admin/clients/${row.id}`}
                className="block truncate font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100"
              >
                {row.first_name} {row.last_name}
              </Link>
              <p className="truncate text-xs text-slate-400">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'company',
        header: 'Company',
        render: (row) =>
          row.company?.name ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Building2 size={14} className="text-slate-400" /> {row.company.name}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge meta={metaFor(CLIENT_STATUS, row.status)} />,
      },
      { key: 'projects_count', header: 'Projects', render: (row) => row.projects_count ?? 0 },
      {
        key: 'created_at',
        header: 'Added',
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
                { label: 'View details', icon: Eye, onClick: () => (window.location.href = `/admin/clients/${row.id}`) },
                { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
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
          title="Clients"
          subtitle="Manage your client accounts and their portal access"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={15} /> Export
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus size={15} /> Add client
              </Button>
            </div>
          }
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            className="sm:max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            containerClassName="sm:max-w-[180px]"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {toOptions(CLIENT_STATUS).map((option) => (
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
              <UserPlus className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No clients found</p>
              <p className="mt-1 text-sm text-slate-400">Add your first client to get started.</p>
              <Button className="mt-4" size="sm" onClick={openCreate}>
                <Plus size={15} /> Add client
              </Button>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      {/* Create / edit */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, client: null })}
        title={modal.client ? 'Edit client' : 'Add client'}
        description={
          modal.client ? 'Update this client’s details.' : 'Create a client and their portal login.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, client: null })}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {modal.client ? 'Save changes' : 'Create client'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="first_name"
              value={form.first_name}
              onChange={set('first_name')}
              error={errors.first_name}
              required
            />
            <Input
              label="Last name"
              name="last_name"
              value={form.last_name}
              onChange={set('last_name')}
              error={errors.last_name}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={set('phone')}
              error={errors.phone}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Position"
              name="position"
              value={form.position}
              onChange={set('position')}
              error={errors.position}
              placeholder="e.g. CEO"
            />
            <Select
              label="Company"
              name="company_id"
              value={form.company_id}
              onChange={set('company_id')}
              error={errors.company_id}
            >
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>
          <Select label="Status" name="status" value={form.status} onChange={set('status')} error={errors.status}>
            {toOptions(CLIENT_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {!modal.client && (
            <Input
              label="Portal password"
              name="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              hint="The client uses this to sign in to their portal."
              required
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this client?"
        message="This removes the client, their projects and portal login. This cannot be undone."
        confirmLabel="Delete client"
      />
    </div>
  );
}
