import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
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
import Badge from '../../components/ui/Badge';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, metaFor, toOptions } from '../../utils/constants';
import { formatDate, paginate, timeAgo } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const EMPTY = { name: '', email: '', password: '', role: 'manager', phone: '', is_active: true };

export default function Users() {
  const { user: currentUser } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState({ open: false, user: null });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        role: role || undefined,
        status: status || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal({ open: true, user: null });
  };

  const openEdit = (target) => {
    setForm({
      name: target.name ?? '',
      email: target.email ?? '',
      password: '',
      role: target.role ?? 'manager',
      phone: target.phone ?? '',
      is_active: target.is_active ?? true,
    });
    setErrors({});
    setModal({ open: true, user: target });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (modal.user) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await userService.update(modal.user.id, payload);
        toast.success('User updated');
      } else {
        await userService.create(form);
        toast.success('User created');
      }
      setModal({ open: false, user: null });
      load();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (target) => {
    try {
      await userService.toggleStatus(target.id);
      toast.success(target.is_active ? 'User deactivated' : 'User activated');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await userService.delete(confirm.id);
      toast.success('User deleted');
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
    exportToCsv('nexclient-users', rows, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'phone', label: 'Phone' },
      { key: 'is_active', label: 'Active' },
      { key: 'last_login_at', label: 'Last login' },
    ]);
    toast.success('CSV exported');
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'User',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} src={row.avatar_url} size={36} />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
              <p className="truncate text-xs text-slate-400">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => <Badge tone={metaFor(USER_ROLES, row.role).tone}>{metaFor(USER_ROLES, row.role).label}</Badge>,
      },
      {
        key: 'is_active',
        header: 'Status',
        render: (row) =>
          row.is_active ? (
            <Badge tone="green" dot>
              Active
            </Badge>
          ) : (
            <Badge tone="rose" dot>
              Inactive
            </Badge>
          ),
      },
      {
        key: 'last_login_at',
        header: 'Last login',
        render: (row) => <span className="text-slate-500">{row.last_login_at ? timeAgo(row.last_login_at) : '—'}</span>,
      },
      {
        key: 'created_at',
        header: 'Joined',
        render: (row) => <span className="text-slate-500">{formatDate(row.created_at)}</span>,
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'text-right',
        className: 'text-right',
        render: (row) => {
          const isSelf = row.id === currentUser?.id;
          return (
            <div className="flex justify-end">
              <Dropdown
                trigger={
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <MoreHorizontal size={16} />
                  </span>
                }
                items={[
                  { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                  { label: row.is_active ? 'Deactivate' : 'Activate', icon: row.is_active ? UserX : UserCheck, onClick: () => toggleStatus(row) },
                  ...(isSelf
                    ? []
                    : [
                        { divider: true },
                        { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm({ open: true, id: row.id }) },
                      ]),
                ]}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Users & roles"
          subtitle="Manage staff accounts and portal access"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={15} /> Export
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus size={15} /> Add user
              </Button>
            </div>
          }
        />

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="lg:max-w-xs" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} containerClassName="lg:max-w-[170px]" aria-label="Filter by role">
            <option value="">All roles</option>
            {toOptions(USER_ROLES).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="lg:max-w-[170px]" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <Table
          columns={columns}
          rows={rows}
          loading={loading}
          empty={
            <div className="py-14 text-center">
              <ShieldCheck className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No users found</p>
              <p className="mt-1 text-sm text-slate-400">Invite your team to collaborate.</p>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, user: null })}
        title={modal.user ? 'Edit user' : 'Add user'}
        description="Staff accounts can be admins or managers."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {modal.user ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" value={form.role} onChange={set('role')} error={errors.role}>
              {toOptions(USER_ROLES).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label={modal.user ? 'New password (optional)' : 'Password'}
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              hint="Minimum 8 characters."
              required={!modal.user}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={set('is_active')}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Account active
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this user?"
        message="They will lose access immediately."
        confirmLabel="Delete user"
      />
    </div>
  );
}
