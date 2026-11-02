import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Dropdown from '../ui/Dropdown';
import { notificationService } from '../../services/notificationService';
import {
  markAllReadLocal,
  markReadLocal,
  setNotifications,
  setUnreadCount,
} from '../../store/slices/notificationSlice';
import { timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loaded } = useSelector((s) => s.notifications);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const base = user?.role === 'client' ? '/client' : '/admin';

  const load = async () => {
    try {
      const { data } = await notificationService.getAll({ per_page: 12 });
      dispatch(setNotifications(data.data ?? []));
    } catch {
      /* silent — notifications are non-critical */
    }
  };

  // Initial load + lightweight polling for near-real-time updates.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    if (!loaded) load();

    const interval = setInterval(async () => {
      try {
        const { data } = await notificationService.unreadCount();
        dispatch(setUnreadCount(data.count));
      } catch {
        /* ignore */
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loaded]);

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        dispatch(markReadLocal(notification.id));
      } catch {
        /* ignore */
      }
    }

    const data = notification.data ?? {};
    if (data.ticket_id) navigate(`${base}/tickets/${data.ticket_id}`);
    else if (data.invoice_id) navigate(`${base}/invoices/${data.invoice_id}`);
    else if (data.project_id) navigate(`${base}/projects/${data.project_id}`);
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch(markAllReadLocal());
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Could not update notifications');
    }
  };

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      }
    >
      <div className="w-80 max-w-[85vw]">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-2 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <CheckCheck size={13} /> Mark all
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-400">You’re all caught up 🎉</p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className={cn(
                'flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
                !n.read && 'bg-brand-50/60 dark:bg-brand-950/20'
              )}
            >
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-500'
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {n.title}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {n.message}
                </span>
                <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Dropdown>
  );
}
