import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  Phone,
  Receipt,
  FolderKanban,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { clientService } from '../../services/clientService';
import { CLIENT_STATUS, INVOICE_STATUS, PROJECT_STATUS, metaFor } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    clientService
      .getById(id)
      .then(({ data }) => setClient(data))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader label="Loading client…" />;
  if (!client) {
    return (
      <EmptyState
        title="Client not found"
        description="This client may have been deleted."
        actionLabel="Back to clients"
        actionTo="/admin/clients"
      />
    );
  }

  const invoices = client.invoices ?? [];
  const projects = client.projects ?? [];
  const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  const outstanding = invoices
    .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to clients
      </Link>

      {/* Header */}
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={`${client.first_name} ${client.last_name}`} src={client.user?.avatar_url} size={64} />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {client.first_name} {client.last_name}
                </h2>
                <StatusBadge meta={metaFor(CLIENT_STATUS, client.status)} />
                {client.user?.is_active === false && <Badge tone="rose">Login disabled</Badge>}
              </div>
              {client.position && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{client.position}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} /> {client.email}
                </span>
                {client.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} /> {client.phone}
                  </span>
                )}
                {(client.city || client.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} /> {[client.city, client.country].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> Added {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:w-72">
            {[
              { label: 'Projects', value: projects.length, icon: FolderKanban },
              { label: 'Invoices', value: invoices.length, icon: Receipt },
              { label: 'Billed', value: formatCurrency(totalBilled), icon: Building2 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {outstanding > 0 && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Outstanding balance
            </p>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{formatCurrency(outstanding)}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company + notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Company" />
            {client.company ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{client.company.name}</p>
                {client.company.email && (
                  <p className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Mail size={13} /> {client.company.email}
                  </p>
                )}
                {client.company.website && (
                  <a
                    href={client.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brand-600 hover:underline"
                  >
                    <Globe size={13} /> {client.company.website}
                  </a>
                )}
                {client.company.tax_number && (
                  <p className="text-slate-500 dark:text-slate-400">Tax no. {client.company.tax_number}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No company linked.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
              {client.notes || 'No notes recorded for this client.'}
            </p>
          </Card>
        </div>

        {/* Projects */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Projects"
            subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'}`}
          />
          {projects.length ? (
            <ul className="space-y-4">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link to={`/admin/projects/${project.id}`} className="group block">
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
            </ul>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Projects created for this client will appear here."
              className="py-10"
            />
          )}
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader title="Invoices" subtitle={`${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`} />
        {invoices.length ? (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr>
                  {['Invoice', 'Issued', 'Due', 'Status', 'Total'].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-6 last:pr-6"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 pl-6">
                      <Link
                        to={`/admin/invoices/${invoice.id}`}
                        className="font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{formatDate(invoice.invoice_date)}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{formatDate(invoice.due_date)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge meta={metaFor(INVOICE_STATUS, invoice.status)} />
                    </td>
                    <td className="px-5 py-3 pr-6 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Invoices raised for this client will appear here."
            className="py-10"
          />
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" to="/admin/clients">
          Back to clients
        </Button>
      </div>
    </div>
  );
}
