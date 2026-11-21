import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select({ label, error, id, options = [], className = '', children, ...props }, ref) {
  const generated = useId();
  const selectId = id || generated;
  return <div className="flex min-w-0 flex-col gap-1.5">
    {label && <label htmlFor={selectId} className="text-sm font-medium">{label}</label>}
    <select ref={ref} id={selectId} className={'field ' + className} aria-invalid={!!error} aria-describedby={error ? selectId + '-error' : undefined} {...props}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}{children}
    </select>
    {error && <p id={selectId + '-error'} className="text-sm text-expense">{error}</p>}
  </div>;
});
export default Select;
