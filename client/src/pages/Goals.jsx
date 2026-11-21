import { useState } from 'react';
import { Plus, Target, Pencil, Trash2, Check } from 'lucide-react';
import { z } from 'zod';
import * as api from '../api/resources.js';
import useResource from '../hooks/useResource.js';
import useCurrency from '../hooks/useCurrency.js';
import { useToast } from '../context/ToastContext.jsx';
import { money, positiveMoney, date } from '../utils/validation.js';
import { formatDate, toInputDate } from '../utils/dates.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import FormDialog from '../components/forms/FormDialog.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
const schema = z.object({ name: z.string().trim().min(1, 'Give your goal a name').max(60), targetAmount: positiveMoney, currentAmount: money, targetDate: date });
export default function Goals() {
  const resource = useResource(api.listGoals);
  const formatMoney = useCurrency();
  const toast = useToast();
  const [editor, setEditor] = useState(null), [contributing, setContributing] = useState(null), [deleting, setDeleting] = useState(null);
  return <div className="page-stack"><PageHeader eyebrow="MAKE ROOM FOR WHAT’S NEXT" title="Savings goals" description="Big dreams start with small, steady steps."><Button onClick={() => setEditor({})}><Plus size={18} />Create goal</Button></PageHeader>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : !resource.data.length ? <Card><EmptyState title="What are you looking forward to?" description="A new laptop, a trip, or a little peace of mind. Give your savings a purpose." action={() => setEditor({})} actionLabel="Create your first goal" /></Card> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{resource.data.map((goal) => <Card key={goal._id}><div className="flex justify-between items-start"><span className={'p-3 rounded-xl ' + (goal.progress === 100 ? 'text-income bg-income-tint' : 'text-primary bg-primary-tint')}>{goal.progress === 100 ? <Check size={24} /> : <Target size={24} />}</span><div className="flex"><button type="button" className="icon-button" aria-label={'Edit ' + goal.name} onClick={() => setEditor(goal)}><Pencil size={16} /></button><button type="button" className="icon-button" aria-label={'Delete ' + goal.name} onClick={() => setDeleting(goal)}><Trash2 size={16} /></button></div></div><h2 className="text-lg font-semibold mt-5 break-words">{goal.name}</h2><p className="text-xs text-text-secondary mt-1">Target date · {formatDate(goal.targetDate)}</p><p className="text-2xl font-semibold tabular-nums mt-6 break-all">{formatMoney(goal.currentAmount)} <span className="text-sm text-text-secondary font-normal">saved</span></p><div className="flex justify-between text-sm gap-2 mt-4 mb-2"><span className="text-text-secondary">of {formatMoney(goal.targetAmount)}</span><span className="text-primary font-semibold">{goal.progress}%</span></div><ProgressBar value={goal.progress} level={goal.progress === 100 ? 'ok' : 'info'} label={goal.name + ' progress'} /><Button className="w-full mt-6" variant="secondary" onClick={() => setContributing(goal)}><Plus size={16} />Add funds</Button></Card>)}</div>}
    <p className="text-sm text-text-secondary">Goal contributions track your savings progress. They do not move money between accounts or create transactions.</p>
    {editor && <FormDialog title={editor._id ? 'Edit savings goal' : 'Create a savings goal'} schema={schema} initial={{ name: editor.name || '', targetAmount: editor.targetAmount || '', currentAmount: editor.currentAmount || 0, targetDate: editor.targetDate?.slice(0, 10) || toInputDate(new Date()) }} fields={[{ name: 'name', label: 'Goal name', maxLength: 60, placeholder: 'e.g. A little adventure' }, { name: 'targetAmount', label: 'Target amount', type: 'number', step: '0.01', min: '0.01' }, { name: 'currentAmount', label: 'Already saved', type: 'number', step: '0.01', min: '0' }, { name: 'targetDate', label: 'Target date', type: 'date' }]} onClose={() => setEditor(null)} onSave={async (values) => { if (editor._id) await api.updateGoal(editor._id, values); else await api.createGoal(values); resource.refetch(); }} successMessage="Savings goal saved" submitLabel={editor._id ? 'Save changes' : 'Create goal'} />}
    {contributing && <FormDialog title={'Add funds to ' + contributing.name} description="Record the amount you have set aside for this goal." schema={z.object({ amount: positiveMoney })} initial={{ amount: '' }} fields={[{ name: 'amount', label: 'Amount to add', type: 'number', min: '0.01', step: '0.01' }]} onClose={() => setContributing(null)} onSave={async ({ amount }) => { await api.contributeGoal(contributing._id, amount); resource.refetch(); }} submitLabel="Add funds" successMessage="You’re a little closer to your goal" />}
    {deleting && <ConfirmDialog title="Delete savings goal?" message={'This will delete ' + deleting.name + ' and its recorded progress.'} onClose={() => setDeleting(null)} onConfirm={async () => { await api.deleteGoal(deleting._id); resource.refetch(); toast('Goal deleted'); }} />}
  </div>;
}
