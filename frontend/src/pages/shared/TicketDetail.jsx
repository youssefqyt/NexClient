import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, Send, Trash2, UserCog } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import { PRIORITY, TICKET_CATEGORY, TICKET_STATUS, metaFor, toOptions } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function TicketDetail() {
  const { id } = useParams();
  const { user, isStaff } = useAuth();
  const base = basePath(user);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);

  const [message, setMessage] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getById(id);
      setTicket(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isStaff) return;
    userService
      .assignable()
      .then(({ data }) => setAgents(data.users ?? []))
      .catch(() => setAgents([]));
  }, [isStaff]);

  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketService.addMessage(id, { message: message.trim(), is_internal: internal });
      setMessage('');
      setInternal(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const updateField = async (payload) => {
    setUpdating(true);
    try {
      await ticketService.update(id, payload);
      setTicket((prev) => ({ ...prev, ...payload }));
      toast.success('Ticket updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    try {
      await ticketService.delete(id);
      toast.success('Ticket deleted');
      window.location.href = `${base}/tickets`;
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <PageLoader label="Loading ticket…" />;
  if (!ticket) {
    return <EmptyState title="Ticket not found" actionLabel="Back to support" actionTo={`${base}/tickets`} />;
  }

  const messages = ticket.messages ?? [];

  return (
    <div className="space-y-6">
      <Link
        to={`${base}/tickets`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to support
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{ticket.subject}</h2>
              <StatusBadge meta={metaFor(TICKET_STATUS, ticket.status)} />
              <StatusBadge meta={metaFor(PRIORITY, ticket.priority)} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{ticket.ticket_number}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {ticket.description}
            </p>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader title="Conversation" subtitle={`${messages.length} message${messages.length === 1 ? '' : 's'}`} />
            <ul className="space-y-4">
              {messages.map((item) => (
                <li
                  key={item.id}
                  className={`flex gap-3 ${
                    item.is_internal ? 'rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30' : ''
                  }`}
                >
                  <Avatar name={item.user?.name} src={item.user?.avatar_url} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.user?.name ?? 'User'}
                      </p>
                      {item.user?.role && (
                        <Badge tone={item.user.role === 'client' ? 'green' : 'violet'}>{item.user.role}</Badge>
                      )}
                      {item.is_internal && (
                        <Badge tone="amber">
                          <Lock size={11} /> Internal
                        </Badge>
                      )}
                      <span className="text-[11px] text-slate-400">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                      {item.message}
                    </p>
                  </div>
                </li>
              ))}
              {!messages.length && (
                <li className="py-8 text-center text-sm text-slate-400">No messages yet.</li>
              )}
            </ul>

            <form onSubmit={send} className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply…"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                {isStaff && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Internal note (hidden from client)
                  </label>
                )}
                <Button type="submit" className="ml-auto" loading={sending}>
                  <Send size={15} /> Send reply
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Requester" />
            <div className="flex items-center gap-3">
              <Avatar name={ticket.client?.name} src={ticket.client?.avatar_url} size={42} />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                  {ticket.client?.name}
                </p>
                <p className="truncate text-xs text-slate-400">{ticket.client?.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge tone={metaFor(TICKET_CATEGORY, ticket.category).tone}>
                {metaFor(TICKET_CATEGORY, ticket.category).label}
              </Badge>
            </div>
          </Card>

          {isStaff && (
            <Card>
              <CardHeader title="Manage" subtitle="Update status, priority and assignee" />
              <div className="space-y-4">
                <Select
                  label="Status"
                  value={ticket.status}
                  disabled={updating}
                  onChange={(e) => updateField({ status: e.target.value })}
                >
                  {toOptions(TICKET_STATUS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Priority"
                  value={ticket.priority}
                  disabled={updating}
                  onChange={(e) => updateField({ priority: e.target.value })}
                >
                  {toOptions(PRIORITY).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Assignee"
                  value={ticket.assigned_to ? String(ticket.assigned_to) : ''}
                  disabled={updating}
                  onChange={(e) => updateField({ assigned_to: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </Select>

                <Button variant="ghost" className="w-full" onClick={() => setConfirm(true)}>
                  <Trash2 size={15} className="text-rose-500" /> Delete ticket
                </Button>
              </div>
            </Card>
          )}

          {!isStaff && (
            <Card>
              <div className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                <UserCog size={18} className="mt-0.5 shrink-0 text-brand-500" />
                <p>Our support team is on it. You’ll be notified by email when there’s an update.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        title="Delete this ticket?"
        message="The whole conversation will be removed. This cannot be undone."
        confirmLabel="Delete ticket"
      />
    </div>
  );
}
