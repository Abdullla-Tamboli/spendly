import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, id, className = '', hint, ...props }, ref) {
  const generated = useId();
  const inputId = id || generated;
  return <div className="flex min-w-0 flex-col gap-1.5">
    {label && <label htmlFor={inputId} className="text-sm font-medium">{label}</label>}
    <input ref={ref} id={inputId} className={'field ' + className} aria-invalid={!!error} aria-describedby={error || hint ? inputId + '-help' : undefined} {...props} />
    {(error || hint) && <p id={inputId + '-help'} className={'text-sm ' + (error ? 'text-expense' : 'text-text-secondary')}>{error || hint}</p>}
  </div>;
});
export default Input;
