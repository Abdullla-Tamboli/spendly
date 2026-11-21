export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 rounded-btn border text-sm text-text-primary placeholder:text-text-muted bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 ${
          error ? 'border-expense' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-expense">{error}</p>}
    </div>
  );
}
