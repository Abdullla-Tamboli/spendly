import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { positiveMoney } from '../../utils/validation.js';
import { errorMessage } from '../../hooks/useResource.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
const schema = z.object({ overall: positiveMoney, categories: z.array(z.object({ category: z.string().min(1, 'Choose a category'), amount: positiveMoney })) }).refine((v) => new Set(v.categories.map((c) => c.category)).size === v.categories.length, { path: ['root'], message: 'Choose each category only once.' });
export default function BudgetForm({ month, budget, categories, onSave, onClose }) {
  const toast = useToast();
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { overall: budget?.overall || '', categories: (budget?.categories || []).map(({ category, amount }) => ({ category, amount })) } });
  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });
  const submit = async (values) => { try { await onSave(values); toast('Monthly budget saved'); onClose(); } catch (err) { setError('root', { message: errorMessage(err) }); } };
  return <Modal open title={'Plan your budget · ' + month} onClose={onClose} busy={isSubmitting}><form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">{errors.root && <p role="alert" className="text-expense text-sm">{errors.root.message}</p>}<Input label="Overall monthly budget" type="number" step="0.01" min="0.01" error={errors.overall?.message} {...register('overall')} /><div className="border-t border-border pt-5"><h3 className="font-semibold text-sm">Category limits</h3><p className="muted mt-2 mb-4">Optional spending limits, tracked independently within your overall budget.</p><div className="space-y-4">{fields.map((field, index) => <div key={field.id} className="flex gap-2 items-start rounded-btn bg-bg p-3"><div className="grid sm:grid-cols-2 gap-3 flex-1 min-w-0"><Select label="Category" options={[{ value: '', label: 'Choose category' }, ...categories.filter((c) => c.type === 'expense').map((c) => ({ value: c.name, label: c.name }))]} error={errors.categories?.[index]?.category?.message} {...register('categories.' + index + '.category')} /><Input label="Category limit" type="number" step="0.01" min="0.01" error={errors.categories?.[index]?.amount?.message} {...register('categories.' + index + '.amount')} /></div><button type="button" className="icon-button shrink-0 mt-6" aria-label={'Remove category limit ' + (index + 1)} onClick={() => remove(index)}><Trash2 size={16} /></button></div>)}</div><Button variant="ghost" className="!text-primary mt-3" onClick={() => append({ category: '', amount: '' })}><Plus size={16} />Add category limit</Button></div><div className="flex justify-end gap-3 border-t border-border pt-5"><Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" loading={isSubmitting}>Save budget</Button></div></form></Modal>;
}
