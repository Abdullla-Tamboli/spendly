import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage } from '../../hooks/useResource.js';

export default function FormDialog({ title, description, schema, initial, fields, onSave, onClose, successMessage = 'Changes saved', submitLabel = 'Save changes' }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: initial });
  const toast = useToast();
  const submit = async (values) => {
    try { await onSave(values); toast(successMessage); onClose(); } catch (err) { const message = errorMessage(err); setError('root', { message }); toast(message, 'error'); }
  };
  return <Modal open title={title} onClose={onClose} busy={isSubmitting}><form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
    {description && <p className="muted leading-relaxed">{description}</p>}
    {errors.root && <p role="alert" className="rounded-btn bg-expense-tint p-3 text-sm text-expense">{errors.root.message}</p>}
    {fields.map(({ name, options, ...props }) => options ? <Select key={name} {...props} options={options} error={errors[name]?.message} {...register(name)} /> : <Input key={name} {...props} error={errors[name]?.message} {...register(name)} />)}
    <div className="flex justify-end gap-3 border-t border-border pt-5 !mt-6"><Button variant="secondary" disabled={isSubmitting} onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{submitLabel}</Button></div>
  </form></Modal>;
}
