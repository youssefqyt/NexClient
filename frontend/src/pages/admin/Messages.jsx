import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Inbox, Mail, MailOpen, MoreHorizontal, Reply } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { contactService } from '../../services/contentService';
import { formatDateTime, paginate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const STATUS_TONE = { new: 'brand', read: 'slate', replied: 'green' };

export default function Messages() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contactService.getAll({ page, per_page: 15, status: status || undefined });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const open = async (row) => {
    setActive(row);
    if (row.status === 'new') {
      try {
        await contactService.getById(row.id);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'read' } : r)));
        setActive({ ...row, status: 'read' });
      } catch {
        // Non-fatal: the message still opens.
      }
    }
  };

  const markReplied = async (row) => {
    try {
      await contactService.updateStatus(row.id, 'replied');
      toast.success('Marked as replied');
      setActive((prev) => (prev ? { ...prev, status: 'replied' } : prev));
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'From',
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
            <p className="truncate text-xs text-slate-400">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'subject',
        header: 'Subject',
        render: (row) => <span className="line-clamp-1 max-w-xs">{row.subject}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Badge tone={STATUS_TONE[row.status] ?? 'slate'} dot>
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'created_at',
        header: 'Received',
        render: (row) => <span className="text-slate-500">{formatDateTime(row.created_at)}</span>,
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
                { label: 'Open', icon: MailOpen, onClick: () => open(row) },
                { label: 'Mark replied', icon: Reply, onClick: () => markReplied(row) },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Messages"
          subtitle="Enquiries submitted through the contact form"
          action={
            <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="w-40" aria-label="Filter by status">
              <option value="">All messages</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </Select>
          }
        />

        <Table
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={open}
          empty={
            <div className="py-14 text-center">
              <Inbox className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No messages</p>
              <p className="mt-1 text-sm text-slate-400">Enquiries from the contact form land here.</p>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.subject}
        description={active ? `${active.name} · ${active.email}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActive(null)}>
              Close
            </Button>
            {active && active.status !== 'replied' && (
              <Button onClick={() => markReplied(active)}>
                <Reply size={15} /> Mark replied
              </Button>
            )}
            {active && (
              <Button variant="outline" href={`mailto:${active.email}?subject=Re: ${active.subject}`}>
                <Mail size={15} /> Email
              </Button>
            )}
          </>
        }
      >
        {active && (
          <div className="space-y-4 text-sm">
            {active.phone && (
              <p className="text-slate-500 dark:text-slate-400">Phone: {active.phone}</p>
            )}
            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{active.message}</p>
            <p className="text-xs text-slate-400">Received {formatDateTime(active.created_at)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
