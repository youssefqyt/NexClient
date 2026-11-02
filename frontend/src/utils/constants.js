// Central place for enums shared between forms, filters and badges so the
// labels/colors stay consistent across admin and client portals.

export const PROJECT_STATUS = {
  pending: { label: 'Pending', tone: 'slate' },
  in_progress: { label: 'In Progress', tone: 'blue' },
  on_hold: { label: 'On Hold', tone: 'amber' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
};

export const TASK_STATUS = {
  todo: { label: 'To Do', tone: 'slate' },
  in_progress: { label: 'In Progress', tone: 'blue' },
  review: { label: 'Review', tone: 'violet' },
  done: { label: 'Done', tone: 'green' },
};

export const TASK_COLUMNS = ['todo', 'in_progress', 'review', 'done'];

export const PRIORITY = {
  low: { label: 'Low', tone: 'slate' },
  medium: { label: 'Medium', tone: 'blue' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'rose' },
};

export const INVOICE_STATUS = {
  draft: { label: 'Draft', tone: 'slate' },
  sent: { label: 'Sent', tone: 'blue' },
  paid: { label: 'Paid', tone: 'green' },
  overdue: { label: 'Overdue', tone: 'rose' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};

export const TICKET_STATUS = {
  open: { label: 'Open', tone: 'blue' },
  in_progress: { label: 'In Progress', tone: 'violet' },
  pending: { label: 'Pending', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
  closed: { label: 'Closed', tone: 'slate' },
};

export const TICKET_CATEGORY = {
  technical: { label: 'Technical', tone: 'blue' },
  billing: { label: 'Billing', tone: 'amber' },
  general: { label: 'General', tone: 'slate' },
  feature_request: { label: 'Feature Request', tone: 'violet' },
  bug: { label: 'Bug', tone: 'rose' },
};

export const CLIENT_STATUS = {
  active: { label: 'Active', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'slate' },
  pending: { label: 'Pending', tone: 'amber' },
};

export const USER_ROLES = {
  admin: { label: 'Admin', tone: 'violet' },
  manager: { label: 'Manager', tone: 'blue' },
  client: { label: 'Client', tone: 'green' },
};

export const MILESTONE_STATUS = {
  pending: { label: 'Pending', tone: 'slate' },
  in_progress: { label: 'In Progress', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
};

export const BLOG_STATUS = {
  draft: { label: 'Draft', tone: 'slate' },
  published: { label: 'Published', tone: 'green' },
  archived: { label: 'Archived', tone: 'amber' },
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'MAD', 'CAD', 'AUD'];

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Africa/Casablanca',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

/** Convert an enum map into <option> data. */
export const toOptions = (map) =>
  Object.entries(map).map(([value, meta]) => ({ value, label: meta.label }));

export const metaFor = (map, value) =>
  map[value] ?? { label: value ?? '—', tone: 'slate' };
