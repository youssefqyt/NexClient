import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/Badge';
import { invoiceService } from '../../services/invoiceService';
import { clientService } from '../../services/clientService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import { CURRENCIES, INVOICE_STATUS, toOptions, metaFor } from '../../utils/constants';
import { clientName, formatCurrency, formatDate, paginate } from '../../utils/format';
import { downloadBlob, exportToCsv } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0 });

const EMPTY = {
  client_id: '',
  project_id: '',
  invoice_date: today(),
  due_date: inDays(14),
  status: 'draft',
  tax_rate: 0,
  discount: 0,
  currency: 'USD',
  notes: '',
  terms: '',
  items: [emptyItem()],
};

export default function Invoices() {
  const { user, isStaff } = useAuth();
  const base = basePath(user);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

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
      const { data } = await invoiceService.getAll({
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
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    if (!isStaff) return;
    clientService.getAll({ per_page: 200 }).then(({ data }) => setClients(data.data ?? [])).catch(() => {});
    projectService.getAll({ per_page: 200 }).then(({ data }) => setProjects(data.data ?? [])).catch(() => {});
  }, [isStaff]);

  const openCreate = () => {
    setForm({ ...EMPTY, items: [emptyItem()] });
    setErrors({});
    setModal(true);
  };

  const setItem = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (index) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const estimatedTotal = useMemo(() => {
    const subtotal = form.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0
    );
    const tax = subtotal * (Number(form.tax_rate || 0) / 100);
    return subtotal + tax - Number(form.discount || 0);
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await invoiceService.create({
        ...form,
        project_id: form.project_id || null,
        tax_rate: Number(form.tax_rate || 0),
        discount: Number(form.discount || 0),
        items: form.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      });
      toast.success('Invoice created');
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
      await invoiceService.delete(confirm.id);
      toast.success('Invoice deleted');
      setConfirm({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const downloadPdf = async (invoice) => {
    try {
      const { data } = await invoiceService.downloadPdf(invoice.id);
      downloadBlob(data, `invoice-${invoice.invoice_number}.pdf`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error('Nothing to export');
    exportToCsv('nexclient-invoices', rows, [
      { key: 'invoice_number', label: 'Invoice' },
      { key: 'client', label: 'Client', value: (r) => clientName(r.client) },
      { key: 'invoice_date', label: 'Issued' },
      { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total' },
      { key: 'currency', label: 'Currency' },
    ]);
    toast.success('CSV exported');
  };

  const columns = useMemo(
    () => [
      {
        key: 'invoice_number',
        header: 'Invoice',
        render: (row) => (
          <Link
            to={`${base}/invoices/${row.id}`}
            className="font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100"
          >
            {row.invoice_number}
          </Link>
        ),
      },
      { key: 'client', header: 'Client', render: (row) => clientName(row.client) },
      { key: 'project', header: 'Project', render: (row) => row.project?.title ?? '—' },
      {
        key: 'invoice_date',
        header: 'Issued',
        render: (row) => <span className="text-slate-500">{formatDate(row.invoice_date)}</span>,
      },
      {
        key: 'due_date',
        header: 'Due',
        render: (row) => <span className="text-slate-500">{formatDate(row.due_date)}</span>,
      },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge meta={metaFor(INVOICE_STATUS, row.status)} /> },
      {
        key: 'total',
        header: 'Total',
        render: (row) => (
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {formatCurrency(row.total, row.currency)}
          </span>
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
                { label: 'View', icon: Eye, onClick: () => (window.location.href = `${base}/invoices/${row.id}`) },
                { label: 'Download PDF', icon: Download, onClick: () => downloadPdf(row) },
                ...(isStaff
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
    [isStaff, base]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Invoices"
          subtitle={isStaff ? 'Bill your clients and track payment status' : 'Your invoices and payment status'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={15} /> Export
              </Button>
              {isStaff && (
                <Button size="sm" onClick={openCreate}>
                  <Plus size={15} /> New invoice
                </Button>
              )}
            </div>
          }
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by invoice number…"
            className="sm:max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            containerClassName="sm:max-w-[180px]"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {toOptions(INVOICE_STATUS).map((option) => (
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
              <FileText className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No invoices found</p>
              <p className="mt-1 text-sm text-slate-400">Invoices you raise will appear here.</p>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      {/* Create invoice */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        size="xl"
        title="New invoice"
        description="Add line items, tax and payment terms."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              Create invoice
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Client"
              value={form.client_id}
              onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
              error={errors.client_id}
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </Select>
            <Select
              label="Project (optional)"
              value={form.project_id}
              onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Invoice date"
              type="date"
              value={form.invoice_date}
              onChange={(e) => setForm((p) => ({ ...p, invoice_date: e.target.value }))}
              error={errors.invoice_date}
              required
            />
            <Input
              label="Due date"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              error={errors.due_date}
              required
            />
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Line items</p>
              <Button type="button" size="sm" variant="ghost" onClick={addItem}>
                <Plus size={14} /> Add item
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => setItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    containerClassName="min-w-[180px] flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setItem(index, 'quantity', e.target.value)}
                    containerClassName="w-20"
                    aria-label="Quantity"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => setItem(index, 'unit_price', e.target.value)}
                    containerClassName="w-28"
                    aria-label="Unit price"
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Tax rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.tax_rate}
              onChange={(e) => setForm((p) => ({ ...p, tax_rate: e.target.value }))}
            />
            <Input
              label="Discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
            />
            <div className="flex flex-col justify-end">
              <p className="text-xs text-slate-400">Estimated total</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(estimatedTotal, form.currency)}
              </p>
            </div>
          </div>

          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
          <Textarea
            label="Terms"
            rows={2}
            value={form.terms}
            onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this invoice?"
        message="This permanently removes the invoice and its line items."
        confirmLabel="Delete invoice"
      />
    </div>
  );
}
