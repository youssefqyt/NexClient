import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const baseField =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 ' +
  'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800';

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}

const Input = forwardRef(function Input(
  { label, error, hint, required, className, containerClassName, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <input
        ref={ref}
        id={inputId}
        className={cn(
          baseField,
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/25 dark:border-rose-800'
            : 'border-slate-200 dark:border-slate-700',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, containerClassName, children, id, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={selectId}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={selectId}
        className={cn(
          baseField,
          'appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9',
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/25 dark:border-rose-800'
            : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, containerClassName, rows = 4, id, ...props },
  ref
) {
  const textareaId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={textareaId}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          baseField,
          'resize-y',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/25 dark:border-rose-800'
            : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      />
    </Field>
  );
});

export default Input;
