import { useState } from 'react';
import { Plus, Pause, Play, Pencil, Trash2, Repeat2 } from 'lucide-react';
import { z } from 'zod';
import * as api from '../api/resources.js';
import useResource, { errorMessage } from '../hooks/useResource.js';
import useCurrency from '../hooks/useCurrency.js';
import { useToast } from '../context/ToastContext.jsx';
import { positiveMoney, date, frequencies } from '../utils/validation.js';
import { formatDate } from '../utils/dates.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import CategoryIcon from '../components/ui/CategoryIcon.jsx';
import FormDialog from '../components/forms/FormDialog.jsx';
import TransactionModal from '../components/transactions/TransactionModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
const load = async () => { const [rules, accounts, categories] = await Promise.all([api.listRecurring(), api.listAccounts(), api.listCategories()]); return { data: { data: { rules: rules.data.data, accounts: accounts.data.data.accounts, categories: categories.data.data.categories } } }; };
const schema = z.object({ account: z.string().min(1), amount: positiveMoney, category: z.string().min(1), note: z.string().trim().max(200), frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']), nextDate: date, endDate: z.string() }).refine((v) => !v.endDate || v.endDate >= v.nextDate, { path: ['endDate'], message: 'End date must be on or after next date' });
export default function Recurring() {
  const resource = useResource(load);
  const money = useCurrency();
  const toast = useToast();
  const [adding, setAdding] = useState(false), [editing, setEditing] = useState(null), [deleting, setDeleting] = useState(null), [busy, setBusy] = useState(null);
  const toggle = async (rule) => { setBusy(rule._id); try { await api.patchRecurring(rule._id, { active: !rule.active }); toast(rule.active ? 'Recurring payment paused' : 'Recurring payment resumed'); resource.refetch(); } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(null); } };
  return <div className="page-stack"><PageHeader eyebrow="THE REGULAR THINGS, TAKEN CARE OF" title="Recurring transactions" description="Keep your regular income and payments on track."><Button onClick={() => setAdding(true)}><Plus size={18} />Add recurring transaction</Button></PageHeader>
    <Card className="!bg-primary-tint !border-blue-100 flex gap-3"><Repeat2 size={20} className="text-primary shrink-0 mt-0.5" /><p className="text-sm text-primary leading-relaxed">Due transactions are added automatically when you sign in or use Spendly, checked at most once an hour. Missed dates are caught up automatically.</p></Card>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : !resource.data.rules.length ? <Card><EmptyState title="Make the regular things easier" description="Add a transaction and turn on recurring for rent, subscriptions, salary, and more." action={() => setAdding(true)} actionLabel="Add recurring transaction" /></Card> : <div className="space-y-4">{resource.data.rules.map((rule) => <Card key={rule._id} className="flex flex-col sm:flex-row gap-5 sm:items-center"><div className="flex gap-3 flex-1 min-w-0"><CategoryIcon category={rule.category} type={rule.type} /><div className="min-w-0"><div className="flex gap-2 items-center flex-wrap"><h2 className="font-semibold text-sm break-words">{rule.note || rule.category}</h2><span className={'text-xs font-medium rounded-full px-2 py-1 ' + (rule.active ? 'bg-income-tint text-income' : 'bg-bg text-text-secondary')}>{rule.active ? 'Active' : 'Paused / ended'}</span></div><p className="text-xs text-text-secondary mt-2 capitalize">{rule.frequency} · {rule.account?.name || 'Account unavailable'}</p><p className="text-xs text-text-secondary mt-1">Next: {formatDate(rule.nextDate)}{rule.endDate ? ' · Ends ' + formatDate(rule.endDate) : ''}</p></div></div><div className="flex justify-between sm:justify-end items-center gap-5"><p className={'font-semibold text-lg tabular-nums ' + (rule.type === 'income' ? 'text-income' : 'text-expense')}>{rule.type === 'income' ? '+' : '-'}{money(rule.amount)}</p><div className="flex gap-1"><button type="button" className="icon-button" disabled={busy === rule._id} aria-label={(rule.active ? 'Pause ' : 'Resume ') + rule.category} onClick={() => toggle(rule)}>{rule.active ? <Pause size={17} /> : <Play size={17} />}</button><button type="button" className="icon-button" aria-label={'Edit recurring ' + rule.category} onClick={() => setEditing(rule)}><Pencil size={17} /></button><button type="button" className="icon-button" aria-label={'Delete recurring ' + rule.category} onClick={() => setDeleting(rule)}><Trash2 size={17} /></button></div></div></Card>)}</div>}
    {adding && <TransactionModal recurringDefault onClose={() => setAdding(false)} onSaved={resource.refetch} />}
    {editing && resource.data && <FormDialog title="Edit recurring transaction" schema={schema} initial={{ account: editing.account?._id || editing.account, amount: editing.amount, category: editing.category, note: editing.note, frequency: editing.frequency, nextDate: editing.nextDate.slice(0, 10), endDate: editing.endDate?.slice(0, 10) || '' }} fields={[{ name: 'amount', label: 'Amount', type: 'number', step: '0.01', min: '0.01' }, { name: 'category', label: 'Category', options: resource.data.categories.filter((c) => c.type === editing.type).map((c) => ({ value: c.name, label: c.name })) }, { name: 'account', label: 'Account', options: resource.data.accounts.map((a) => ({ value: a._id, label: a.name })) }, { name: 'frequency', label: 'Frequency', options: frequencies }, { name: 'nextDate', label: 'Next date', type: 'date' }, { name: 'endDate', label: 'End date (optional)', type: 'date' }, { name: 'note', label: 'Note', maxLength: 200 }]} onClose={() => setEditing(null)} onSave={async (values) => { await api.patchRecurring(editing._id, { ...values, endDate: values.endDate || null }); resource.refetch(); }} successMessage="Recurring transaction updated" />}
    {deleting && <ConfirmDialog title="Delete recurring schedule?" message="Future occurrences will stop. Transactions already recorded will stay in your history." onClose={() => setDeleting(null)} onConfirm={async () => { await api.deleteRecurring(deleting._id); resource.refetch(); toast('Recurring schedule deleted'); }} />}
  </div>;
}
