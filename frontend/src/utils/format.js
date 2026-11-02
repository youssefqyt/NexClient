// Formatting helpers kept dependency-free so they are trivially testable.

export const formatCurrency = (value, currency = 'USD') => {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value ?? 0));

export const formatDate = (value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', opts).format(date);
};

export const formatDateTime = (value) =>
  formatDate(value, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** "3 days ago" style relative time. */
export const timeAgo = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, secs] of units) {
    const amount = Math.floor(seconds / secs);
    if (amount >= 1) return `${amount} ${unit}${amount > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - start) / (1000 * 60 * 60 * 24));
};

export const isOverdue = (value, done = false) => !done && daysUntil(value) < 0;

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

/** Full name for a client record. */
export const clientName = (client) =>
  client?.first_name ? `${client.first_name} ${client.last_name ?? ''}`.trim() : client?.name ?? '—';

export const truncate = (text = '', length = 120) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;

/** Shape a Laravel paginator for table components. */
export const paginate = (payload) => ({
  items: payload?.data ?? [],
  meta: {
    currentPage: payload?.current_page ?? 1,
    lastPage: payload?.last_page ?? 1,
    perPage: payload?.per_page ?? 15,
    total: payload?.total ?? 0,
    from: payload?.from ?? 0,
    to: payload?.to ?? 0,
  },
});
