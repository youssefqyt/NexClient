import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, CalendarDays, CreditCard, Download, Mail, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import { invoiceService } from '../../services/invoiceService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import { INVOICE_STATUS, toOptions, metaFor } from '../../utils/constants';
import { clientName, formatCurrency, formatDate } from '../../utils/format';
import { downloadBlob } from '../../utils/csv';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

const today = () => new Date().toISOString().slice(0, 10);

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user, isStaff } = useAuth();
  const base = basePath(user);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const [payModal, setPayModal] = useState(false);
  const [payment, setPayment] = useState({ amount: '', payment_method: 'bank_transfer', payment_date: today(), transaction_id: '', notes: '' });
  const [pErrors, setPErrors] = useState({});
  const [savingPayment, setSavingPayment] = useState(false);

  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await invoiceService.getById(id);
      setInvoice(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status) => {
    setSavingStatus(true);
    try {
      await invoiceService.update(id, { status });
      setInvoice((prev) => ({ ...prev, status }));
      toast.success(`Marked as ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingStatus(false);
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    setPErrors({});
    try {
      await invoiceService.recordPayment(id, {
        ...payment,
        amount: Number(payment.amount),
      });
      toast.success('Payment recorded');
      setPayModal(false);
      load();
    } catch (error) {
      setPErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPayment(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await invoiceService.delete(id);
      toast.success('Invoice deleted');
      window.location.href = `${base}/invoices`;
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeleting(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const { data } = await invoiceService.downloadPdf(id);
      downloadBlob(data, `invoice-${invoice.invoice_number}.pdf`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <PageLoader label="Loading invoice…" />;
  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        actionLabel="Back to invoices"
        actionTo={`${base}/invoices`}
      />
    );
  }

  const items = invoice.items ?? [];
  const payments = invoice.payments ?? [];
  const paid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const balance = Number(invoice.total ?? 0) - paid;

  return (
    <div className="space-y-6">
      <Link
        to={`${base}/invoices`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to invoices
      </Link>

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</h2>
              <StatusBadge meta={metaFor(INVOICE_STATUS, invoice.status)} />
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-200">{clientName(invoice.client)}</p>
              {invoice.client?.email && (
                <p className="inline-flex items-center gap-1.5">
                  <Mail size={13} /> {invoice.client.email}
                </p>
              )}
              {invoice.client?.company?.name && (
                <p className="inline-flex items-center gap-1.5">
                  <Building2 size={13} /> {invoice.client.company.name}
                </p>
              )}
              <p className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} /> Issued {formatDate(invoice.invoice_date)} · Due{' '}
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadPdf}>
              <Download size={15} /> PDF
            </Button>
            {isStaff && (
              <>
                <Button onClick={() => setPayModal(true)}>
                  <CreditCard size={15} /> Record payment
                </Button>
                <Select
                  value={invoice.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  disabled={savingStatus}
                  className="!h-11"
                  containerClassName="w-40"
                  aria-label="Change status"
                >
                  {toOptions(INVOICE_STATUS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Line items" subtitle={invoice.project?.title ?? 'No project linked'} />
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr>
                  {['Description', 'Qty', 'Unit price', 'Amount'].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-6 last:pr-6 last:text-right"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 pl-6 text-sm text-slate-700 dark:text-slate-300">
                      {item.description}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{item.quantity}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {formatCurrency(item.unit_price, invoice.currency)}
                    </td>
                    <td className="px-5 py-3 pr-6 text-right text-sm font-medium text-slate-800 dark:text-slate-100">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 ml-auto max-w-xs space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax ({invoice.tax_rate}%)</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {formatCurrency(invoice.tax_amount, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                −{formatCurrency(invoice.discount, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold dark:border-slate-800">
              <dt className="text-slate-900 dark:text-white">Total</dt>
              <dd className="text-slate-900 dark:text-white">
                {formatCurrency(invoice.total, invoice.currency)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Payment summary" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Paid</dt>
                <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paid, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Balance</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-100">
                  {formatCurrency(balance, invoice.currency)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payments" subtitle={`${payments.length} recorded`} />
            {payments.length ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {formatCurrency(p.amount, invoice.currency)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(p.payment_date)} · {p.payment_method ?? 'manual'}
                      </p>
                    </div>
                    <Badge tone="green">Received</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">No payments recorded yet.</p>
            )}
          </Card>

          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardHeader title="Notes & terms" />
              {invoice.notes && <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.notes}</p>}
              {invoice.terms && (
                <p className="mt-2 text-xs text-slate-400">{invoice.terms}</p>
              )}
            </Card>
          )}
        </div>
      </div>

      {isStaff && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            <Trash2 size={15} className="text-rose-500" /> Delete invoice
          </Button>
        </div>
      )}

      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Record a payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(false)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} loading={savingPayment}>
              Save payment
            </Button>
          </>
        }
      >
        <form onSubmit={recordPayment} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={payment.amount}
            onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
            error={pErrors.amount}
            hint={`Outstanding balance: ${formatCurrency(balance, invoice.currency)}`}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Method"
              value={payment.payment_method}
              onChange={(e) => setPayment((p) => ({ ...p, payment_method: e.target.value }))}
            >
              {['bank_transfer', 'credit_card', 'paypal', 'cash', 'other'].map((method) => (
                <option key={method} value={method}>
                  {method.replace('_', ' ')}
                </option>
              ))}
            </Select>
            <Input
              label="Payment date"
              type="date"
              value={payment.payment_date}
              onChange={(e) => setPayment((p) => ({ ...p, payment_date: e.target.value }))}
              error={pErrors.payment_date}
              required
            />
          </div>
          <Input
            label="Reference (optional)"
            value={payment.transaction_id}
            onChange={(e) => setPayment((p) => ({ ...p, transaction_id: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this invoice?"
        message="This cannot be undone."
        confirmLabel="Delete invoice"
      />
    </div>
  );
}
