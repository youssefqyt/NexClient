import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FolderKanban } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { projectService } from '../../services/projectService';
import { PRIORITY, PROJECT_STATUS, metaFor } from '../../utils/constants';
import { formatDate, paginate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

export default function ClientProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    projectService
      .getAll({ per_page: 100, search: debounced || undefined })
      .then(({ data }) => setProjects(paginate(data).items))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My projects</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Everything we’re working on for you, in real time.
          </p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" className="w-64" />
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : projects.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} hover>
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/client/projects/${project.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-brand-600 dark:text-white"
                >
                  {project.title}
                </Link>
                <StatusBadge meta={metaFor(PROJECT_STATUS, project.status)} />
              </div>
              {project.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {project.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Deadline {formatDate(project.deadline)}</span>
                <Badge tone={metaFor(PRIORITY, project.priority).tone}>
                  {metaFor(PRIORITY, project.priority).label}
                </Badge>
              </div>
              <ProgressBar className="mt-4" value={project.progress} showLabel />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{project.tasks_count ?? 0} tasks</span>
                <Link to={`/client/projects/${project.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Open board →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="When we kick off work for you, it will appear here."
          />
        </Card>
      )}
    </div>
  );
}
