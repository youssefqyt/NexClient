import {
  Activity,
  BarChart3,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  PenSquare,
  Receipt,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';

/** Admin / manager navigation. `staffOnly` items are hidden from managers. */
export const adminNav = [
  {
    section: 'Workspace',
    items: [
      { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'Delivery',
    items: [
      { to: '/admin/clients', label: 'Clients', icon: Users },
      { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    section: 'Business',
    items: [
      { to: '/admin/invoices', label: 'Invoices', icon: Receipt },
      { to: '/admin/tickets', label: 'Support', icon: LifeBuoy },
      { to: '/admin/messages', label: 'Messages', icon: Mail },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserCog, staffOnly: true },
      { to: '/admin/blog', label: 'Blog', icon: PenSquare, staffOnly: true },
      { to: '/admin/activity', label: 'Activity', icon: Activity },
      { to: '/admin/settings', label: 'Settings', icon: Settings, staffOnly: true },
    ],
  },
];

export const clientNav = [
  {
    section: 'Workspace',
    items: [
      { to: '/client/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/client/projects', label: 'My Projects', icon: FolderKanban },
    ],
  },
  {
    section: 'Business',
    items: [
      { to: '/client/invoices', label: 'Invoices', icon: Receipt },
      { to: '/client/tickets', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/client/profile', label: 'Profile', icon: UserCog },
      { to: '/client/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const navForRole = (role) => (role === 'client' ? clientNav : adminNav);

/** Flatten to [{ to, label }] for breadcrumb/title lookup. */
export const flatNav = (role) =>
  navForRole(role).flatMap((group) =>
    group.items.map(({ to, label }) => ({ to, label }))
  );
