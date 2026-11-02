import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Table from '../../components/ui/Table';
import { DonutChart, RevenueChart, StatusBarChart } from '../../components/dashboard/Charts';
import { analyticsService } from '../../services/analyticsService';
import { PRIORITY, TASK_STATUS, metaFor } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const YEARS = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

export default function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenue, setRevenue] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [clients, setClients] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsService.getRevenue(year),
      analyticsService.getTasks(),
      analyticsService.getClients(year),
      analyticsService.getDashboard(),
    ])
      .then(([rev, tsk, cli, dash]) => {
        setRevenue(rev.data);
        setTasks(tsk.data);
        setClients(cli.data);
        setDashboard(dash.data);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <Card className="h-80" />
        <CardSkeleton count={2} />
      </div>
    );
  }

  const stats = dashboard?.stats ?? {};
  const tasksByStatus = (tasks?.by_status ?? []).map((row) => ({
    label: metaFor(TASK_STATUS, row.status).label,
    count: Number(row.count),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Performance across revenue, delivery and client growth.
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Select year"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue ${year}`}
          value={formatCurrency(revenue?.total)}
          icon={DollarSign}
          tone="green"
          delay={0}
        />
        <StatCard
          label="Client growth"
          value={`+${(clients?.data ?? []).reduce((sum, m) => sum + m.count, 0)}`}
          icon={Users}
          tone="brand"
          hint={`new clients in ${year}`}
          delay={0.05}
        />
        <StatCard
          label="Completed tasks"
          value={stats.completed_tasks ?? 0}
          icon={TrendingUp}
          tone="blue"
          delay={0.1}
        />
        <StatCard
          label="Overdue tasks"
          value={stats.overdue_tasks ?? 0}
          icon={AlertTriangle}
          tone="rose"
          delay={0.15}
        />
      </div>

      <Card>
        <CardHeader
          title="Revenue trend"
          subtitle="Paid invoices per month"
          action={<Badge tone="green">{formatCurrency(revenue?.total)}</Badge>}
        />
        <RevenueChart data={revenue?.data ?? []} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Client growth" subtitle={`New clients per month in ${year}`} />
          <StatusBarChart data={clients?.data ?? []} />
        </Card>
        <Card>
          <CardHeader title="Tasks by status" subtitle="Across all projects" />
          <DonutChart data={tasksByStatus} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Overdue tasks"
          subtitle="Needs attention — past their due date"
          action={<Badge tone="rose">{(tasks?.overdue ?? []).length} items</Badge>}
        />
        <Table
          rows={tasks?.overdue ?? []}
          rowKey={(row) => row.id}
          empty={<p className="py-10 text-center text-sm text-slate-400">Nothing overdue. 🎉</p>}
          columns={[
            { key: 'title', header: 'Task', render: (row) => <span className="font-medium">{row.title}</span> },
            { key: 'project', header: 'Project', render: (row) => row.project?.title ?? '—' },
            {
              key: 'due_date',
              header: 'Due date',
              render: (row) => (
                <span className="text-rose-600 dark:text-rose-400">{formatDate(row.due_date)}</span>
              ),
            },
            {
              key: 'priority',
              header: 'Priority',
              render: (row) => <StatusBadge meta={metaFor(PRIORITY, row.priority)} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
