import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity as ActivityIcon } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { activityService } from '../../services/contentService';
import { userService } from '../../services/userService';
import { formatDateTime, paginate, timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const ACTION_TONE = (action = '') => {
  if (action.includes('deleted')) return 'rose';
  if (action.includes('created')) return 'green';
  if (action.includes('updated')) return 'blue';
  if (action.includes('payment') || action.includes('invoice')) return 'amber';
  return 'slate';
};

export default function Activity() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);

  const debouncedAction = useDebounce(action, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await activityService.getAll({
        page,
        per_page: 20,
        action: debouncedAction || undefined,
        user_id: userId || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedAction, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedAction, userId]);

  useEffect(() => {
    userService.getAll({ per_page: 200 }).then(({ data }) => setUsers(data.data ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Activity log"
          subtitle="An audit trail of everything happening in the workspace"
          action={
            <div className="flex flex-wrap gap-2">
              <SearchInput
                value={action}
                onChange={setAction}
                placeholder="Filter by action (e.g. project.created)"
                className="w-64"
              />
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} containerClassName="w-48" aria-label="Filter by user">
                <option value="">All users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
          }
        />

        {loading ? (
          <CardSkeleton count={3} />
        ) : rows.length ? (
          <ol className="relative space-y-5 border-l border-slate-200 pl-6 dark:border-slate-800">
            {rows.map((log) => (
              <li key={log.id} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-brand-500 dark:border-slate-900" />
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar name={log.user?.name} src={log.user?.avatar_url} size={26} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {log.user?.name ?? 'System'}
                  </span>
                  <Badge tone={ACTION_TONE(log.action)}>{log.action}</Badge>
                  <span className="text-xs text-slate-400" title={formatDateTime(log.created_at)}>
                    {timeAgo(log.created_at)}
                  </span>
                </div>
                {log.properties && Object.keys(log.properties).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    {JSON.stringify(log.properties, null, 2)}
                  </pre>
                )}
                {log.ip_address && (
                  <p className="mt-1 text-[11px] text-slate-400">IP {log.ip_address}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={ActivityIcon} title="No activity found" description="Actions will appear here as they happen." />
        )}

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>
    </div>
  );
}
