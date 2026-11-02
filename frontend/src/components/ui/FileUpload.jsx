import { useRef, useState } from 'react';
import { CloudUpload, FileText, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/format';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB, mirrors the API rule

/** Drag & drop uploader with preview, validation and progress. */
export default function FileUpload({
  onFiles,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip',
  multiple = false,
  progress = 0,
  uploading = false,
  className,
  label = 'Drag & drop files here, or click to browse',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');

  const handleFiles = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const tooBig = files.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds the 10 MB limit.`);
      return;
    }

    setError('');
    setPreviews(
      files.map((file) => ({
        name: file.name,
        size: file.size,
        isImage: file.type.startsWith('image/'),
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }))
    );
    onFiles?.(multiple ? files : files[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const clear = () => {
    previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPreviews([]);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={label}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
        )}
      >
        <CloudUpload size={26} className="text-brand-500" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs text-slate-400">Max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}

      {uploading && progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{progress}% uploaded</p>
        </div>
      )}

      {previews.length > 0 && (
        <ul className="mt-3 space-y-2">
          {previews.map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900"
            >
              {p.isImage ? (
                <img src={p.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                  <FileText size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(p.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                aria-label="Remove file"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { ImageIcon };
