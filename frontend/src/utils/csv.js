/** Minimal CSV export — turns an array of objects into a downloadable file. */
export function exportToCsv(filename, rows, columns) {
  if (!rows?.length) return;

  const cols = columns ?? Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const csv = [
    cols.map((c) => escape(c.label)).join(','),
    ...rows.map((row) => cols.map((c) => escape(c.value ? c.value(row) : row[c.key])).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Trigger a browser download for a blob response (e.g. invoice PDFs). */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
