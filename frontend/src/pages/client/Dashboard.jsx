import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, CheckSquare, DollarSign, FolderKanban, LifeBuoy, Receipt } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import ProgressBar from '../../components/ui/ProgressBar';
import { DonutChart } from '../../components/dashboard/Charts';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import { INVOICE_STATUS, PRIORITY, PROJECT_STATUS, TICKET_STATUS, metaFor } from '../../utils/constants';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getDashboard()
      .then(({ data: payload }) => setData(payload))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton count={2} />
        <Card className="h-72" />
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const projectsByStatus = (data?.projects_by_status ?? []).map((row) => ({
    label: metaFor(PROJECT_STATUS, row.status)?.label ?? row.status ?? '—',
    count: Number(row.count ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hi {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your projects, invoices and support requests.
          </p>
        </div>
        <Badge tone="brand" dot>
          Your workspace
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={stats.active_projects ?? 0} icon={FolderKanban} tone="brand" hint={`${stats.total_projects ?? 0} total`} delay={0} />
        <StatCard label="Open tickets" value={stats.open_tickets ?? 0} icon={LifeBuoy} tone="amber" delay={0.05} />
        <StatCard
          label="Unpaid amount"
          value={formatCurrency(stats.unpaid_amount)}
          icon={DollarSign}
          tone="rose"
          hint={`${formatCurrency(stats.paid_amount)} paid`}
          delay={0.1}
        />
        <StatCard
          label="Completed tasks"
          value={stats.completed_tasks ?? 0}
          icon={CheckSquare}
          tone="green"
          hint={`${stats.total_tasks ?? 0} total`}
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your projects"
            action={
              <Link to="/client/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="space-y-4">
            {(data?.recent_projects ?? []).map((project) => (
              <li key={project.id}>
                <Link to={`/client/projects/${project.id}`} className="group block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-brand-600 dark:text-slate-200">
                      {project.title}
                    </p>
                    <StatusBadge meta={metaFor(PROJECT_STATUS, project.status)} />
                  </div>
                  <ProgressBar className="mt-2" value={project.progress} showLabel />
                </Link>
              </li>
            ))}
            {!data?.recent_projects?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No projects yet.</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Project status" subtitle="Where things stand" />
          {projectsByStatus.length ? (
            <DonutChart data={projectsByStatus} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">Nothing to show yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Recent invoices"
            action={
              <Link to="/client/invoices" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data?.recent_invoices ?? []).map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/client/invoices/${invoice.id}`}
                    className="block truncate text-sm font-medium text-slate-800 hover:text-brand-600 dark:text-slate-200"
                  >
                    {invoice.invoice_number}
                  </Link>
                  <p className="text-xs text-slate-400">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                  <StatusBadge meta={metaFor(INVOICE_STATUS, invoice.status)} />
                </div>
              </li>
            ))}
            {!data?.recent_invoices?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No invoices yet.</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming deadlines"
            action={
              <Link to="/client/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Projects
              </Link>
            }
          />
          <ul className="space-y-3">
            {(data?.upcoming_deadlines ?? []).map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <CalendarClock size={12} /> {formatDate(task.due_date)}
                  </p>
                </div>
                <StatusBadge meta={metaFor(PRIORITY, task.priority)} />
              </li>
            ))}
            {!data?.upcoming_deadlines?.length && (
              <li className="py-6 text-center text-sm text-slate-400">Nothing due soon. 🎉</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Recent tickets"
            action={
              <Link to="/client/tickets" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="space-y-3">
            {(data?.recent_tickets ?? []).map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/client/tickets/${ticket.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{ticket.subject}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <Receipt size={11} className="mr-1 inline" />
                      {timeAgo(ticket.created_at)}
                    </p>
                  </div>
                  <StatusBadge meta={metaFor(TICKET_STATUS, ticket.status)} />
                </Link>
              </li>
            ))}
            {!data?.recent_tickets?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No tickets yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
