import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckSquare,
  DollarSign,
  FolderKanban,
  LifeBuoy,
  Receipt,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import ProgressBar from '../../components/ui/ProgressBar';
import { DonutChart, RevenueChart } from '../../components/dashboard/Charts';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import {
  INVOICE_STATUS,
  PROJECT_STATUS,
  TICKET_STATUS,
  metaFor,
} from '../../utils/constants';
import { clientName, formatCurrency, timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
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
        <Card className="h-80" />
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const revenue = (data?.monthly_revenue ?? []).map((row) => ({
    label: MONTHS[(Number(row.month) || 1) - 1] ?? `M${row.month}`,
    revenue: Number(row.revenue ?? 0),
  }));
  const projectsByStatus = (data?.projects_by_status ?? []).map((row) => ({
    label: metaFor(PROJECT_STATUS, row.status)?.label ?? row.status ?? '—',
    count: Number(row.count ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here’s what’s happening across your agency today.
          </p>
        </div>
        <Badge tone="brand" dot>
          Live data
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={DollarSign}
          tone="green"
          hint={`${formatCurrency(stats.total_outstanding)} outstanding`}
          delay={0}
        />
        <StatCard
          label="Active projects"
          value={stats.active_projects ?? 0}
          icon={FolderKanban}
          tone="brand"
          hint={`${stats.total_projects ?? 0} total`}
          delay={0.05}
        />
        <StatCard
          label="Pending tasks"
          value={stats.pending_tasks ?? 0}
          icon={CheckSquare}
          tone="blue"
          hint={`${stats.overdue_tasks ?? 0} overdue`}
          delay={0.1}
        />
        <StatCard
          label="Open tickets"
          value={stats.open_tickets ?? 0}
          icon={LifeBuoy}
          tone="amber"
          hint={`${stats.overdue_invoices ?? 0} overdue invoices`}
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue this year"
            subtitle="Paid invoices per month"
            action={<Badge tone="green">{formatCurrency(stats.total_revenue)}</Badge>}
          />
          {revenue.length ? (
            <RevenueChart data={revenue} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No paid invoices yet this year.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Projects by status" subtitle="Delivery pipeline" />
          {projectsByStatus.length ? (
            <DonutChart data={projectsByStatus} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No projects yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent projects */}
        <Card>
          <CardHeader
            title="Recent projects"
            action={
              <Link to="/admin/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="space-y-4">
            {(data?.recent_projects ?? []).map((project) => (
              <li key={project.id}>
                <Link to={`/admin/projects/${project.id}`} className="group block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-brand-600 dark:text-slate-200">
                      {project.title}
                    </p>
                    <StatusBadge meta={metaFor(PROJECT_STATUS, project.status)} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{clientName(project.client)}</p>
                  <ProgressBar className="mt-2" value={project.progress} />
                </Link>
              </li>
            ))}
            {!data?.recent_projects?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No projects yet</li>
            )}
          </ul>
        </Card>

        {/* Recent invoices */}
        <Card>
          <CardHeader
            title="Recent invoices"
            action={
              <Link to="/admin/invoices" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data?.recent_invoices ?? []).map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/admin/invoices/${invoice.id}`}
                    className="block truncate text-sm font-medium text-slate-800 hover:text-brand-600 dark:text-slate-200"
                  >
                    {invoice.invoice_number}
                  </Link>
                  <p className="text-xs text-slate-400">{clientName(invoice.client)}</p>
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
              <li className="py-6 text-center text-sm text-slate-400">No invoices yet</li>
            )}
          </ul>
        </Card>

        {/* Recent tickets */}
        <Card>
          <CardHeader
            title="Recent tickets"
            action={
              <Link to="/admin/tickets" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="space-y-3">
            {(data?.recent_tickets ?? []).map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/admin/tickets/${ticket.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {ticket.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {ticket.client?.name} · {timeAgo(ticket.created_at)}
                    </p>
                  </div>
                  <StatusBadge meta={metaFor(TICKET_STATUS, ticket.status)} />
                </Link>
              </li>
            ))}
            {!data?.recent_tickets?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No tickets yet</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick actions" subtitle="Jump straight into common tasks" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/admin/clients', label: 'Add a client', icon: Users, tone: 'bg-brand-50 text-brand-600 dark:bg-brand-950/50' },
            { to: '/admin/projects', label: 'New project', icon: FolderKanban, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50' },
            { to: '/admin/invoices', label: 'Create invoice', icon: Receipt, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50' },
            { to: '/admin/analytics', label: 'View analytics', icon: ArrowUpRight, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft dark:border-slate-800"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}>
                <action.icon size={18} />
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
