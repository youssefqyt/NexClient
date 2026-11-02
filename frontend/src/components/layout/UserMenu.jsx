import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function UserMenu() {
  const { user, isClient, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const profilePath = isClient ? '/client/profile' : '/admin/profile';
  const settingsPath = isClient ? '/client/settings' : '/admin/settings';

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900">
          <Avatar name={user.name} src={user.avatar_url} size={30} />
          <span className="hidden text-left sm:block">
            <span className="block max-w-[120px] truncate text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {user.name}
            </span>
            <span className="block text-[11px] capitalize leading-tight text-slate-400">{user.role}</span>
          </span>
        </span>
      }
      items={[
        { label: 'My profile', icon: User, onClick: () => navigate(profilePath) },
        { label: 'Settings', icon: Settings, onClick: () => navigate(settingsPath) },
        { divider: true },
        { label: 'Sign out', icon: LogOut, danger: true, onClick: logout },
      ]}
    />
  );
}
