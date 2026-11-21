import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Repeat2, Paperclip } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { toInputDate } from '../../utils/dates.js';
import { createCategory } from '../../api/resources.js';
import { errorMessage } from '../../hooks/useResource.js';
import { useToast } from '../../context/ToastContext.jsx';

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.coerce.number().positive('Enter an amount greater than zero').max(1e9).refine((v) => Math.round(v * 100) / 100 === v, 'Use at most 2 decimal places'),
  category: z.string().min(1, 'Choose a category'),
  account: z.string().min(1, 'Choose an account'),
  date: z.string().min(1, 'Choose a date'),
  note: z.string().trim().max(200),
  recurringEnabled: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  endDate: z.string(),
}).refine((v) => !v.recurringEnabled || !v.endDate || v.endDate >= v.date, { message: 'End date must be on or after the transaction date', path: ['endDate'] });
export default function TransactionForm({ initial, accounts, categories, attachmentsEnabled = false, recurringDefault = false, onSubmit, onCancel }) {
  const toast = useToast();
  const [custom, setCustom] = useState([]);
  const [creating, setCreating] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [file, setFile] = useState(null);
  const { register, control, setValue, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: {
    type: initial?.type || 'expense', amount: initial?.amount || '', category: initial?.category || '', account: initial?.account?._id || initial?.account || accounts[0]?._id || '', date: initial ? initial.date.slice(0, 10) : toInputDate(new Date()), note: initial?.note || '', recurringEnabled: recurringDefault, frequency: 'monthly', endDate: '',
  } });
  const type = useWatch({ control, name: 'type' });
  const recurring = useWatch({ control, name: 'recurringEnabled' });
  const options = [...categories, ...custom].filter((c) => c.type === type);
  const changeType = (next) => { setValue('type', next); setValue('category', ''); };
  const addCategory = async () => {
    if (!categoryName.trim()) return;
    setCategoryBusy(true);
    try { const res = await createCategory({ name: categoryName.trim(), type, icon: 'tag' }); const category = res.data.data.category; setCustom((all) => [...all, category]); setValue('category', category.name); setCreating(false); setCategoryName(''); toast('Category created'); } catch (err) { toast(errorMessage(err), 'error'); } finally { setCategoryBusy(false); }
  };
  const submit = async (values) => {
    if (file && (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 2 * 1024 * 1024)) { setError('root', { message: 'Choose a JPEG, PNG, or PDF no larger than 2 MB.' }); return; }
    const { recurringEnabled, frequency, endDate, ...payload } = values;
    if (!initial && recurringEnabled) payload.recurring = { enabled: true, frequency, ...(endDate ? { endDate } : {}) };
    try { await onSubmit(payload, file); } catch (err) { setError('root', { message: errorMessage(err) }); }
  };
  return <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
    {errors.root && <p role="alert" className="text-sm text-expense bg-expense-tint rounded-btn p-3">{errors.root.message}</p>}
    <div className="flex rounded-btn p-1 bg-bg border border-border" role="group" aria-label="Transaction type">{['expense', 'income'].map((value) => <button type="button" key={value} aria-pressed={type === value} onClick={() => changeType(value)} className={'flex-1 rounded-md py-2.5 text-sm font-semibold capitalize ' + (type === value ? 'bg-white text-primary border border-border' : 'text-text-secondary')}>{value}</button>)}</div>
    <Input label="Amount" type="number" min="0.01" max="1000000000" step="0.01" inputMode="decimal" placeholder="0.00" className="!text-2xl font-semibold tabular-nums !py-4" error={errors.amount?.message} {...register('amount')} />
    <div className="grid sm:grid-cols-2 gap-4"><Select label="Category" options={[{ value: '', label: 'Choose a category' }, ...options.map((c) => ({ value: c.name, label: c.name }))]} error={errors.category?.message} {...register('category')} /><Select label="Account" options={accounts.map((a) => ({ value: a._id, label: a.name }))} error={errors.account?.message} {...register('account')} /></div>
    {creating ? <div className="flex flex-wrap gap-2 rounded-btn bg-bg p-3"><div className="flex-1 min-w-40"><Input label="New category name" maxLength={30} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} /></div><Button className="self-end" loading={categoryBusy} onClick={addCategory}>Create category</Button><Button variant="ghost" className="self-end" onClick={() => setCreating(false)}>Cancel</Button></div> : <button type="button" className="inline-flex text-sm text-primary font-medium items-center gap-1.5" onClick={() => setCreating(true)}><Plus size={16} />Create a category</button>}
    <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
    <Input label="Note (optional)" placeholder="What was it for?" maxLength={200} error={errors.note?.message} {...register('note')} />
    {attachmentsEnabled && <div><Input label="Receipt (optional)" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} hint="JPEG, PNG, or PDF · up to 2 MB" />{initial?.attachment?.url && <a className="inline-flex gap-1 text-primary text-sm mt-2" href={initial.attachment.url} target="_blank" rel="noreferrer"><Paperclip size={16} />Current receipt</a>}</div>}
    {!initial && <div className="border border-border rounded-card p-4"><label className="flex gap-3 items-center text-sm font-medium"><Repeat2 size={18} className="text-text-secondary" /><span className="flex-1">Make this recurring</span><input type="checkbox" className="w-5 h-5 accent-primary" {...register('recurringEnabled')} /></label>{recurring && <div className="grid sm:grid-cols-2 gap-4 mt-4"><Select label="Frequency" options={['daily', 'weekly', 'monthly', 'yearly'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} {...register('frequency')} /><Input label="End date (optional)" type="date" error={errors.endDate?.message} {...register('endDate')} /></div>}</div>}
    {initial?.recurringRule && <p className="muted">This edits only this transaction. You can change future occurrences on the Recurring page.</p>}
    <div className="flex justify-end gap-3 border-t border-border pt-5"><Button variant="secondary" disabled={isSubmitting} onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting} disabled={!accounts.length || categoryBusy}>{initial ? 'Save changes' : 'Add transaction'}</Button></div>
  </form>;
}
