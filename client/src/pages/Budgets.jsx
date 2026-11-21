import { useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import * as api from '../api/resources.js';
import useResource from '../hooks/useResource.js';
import { useToast } from '../context/ToastContext.jsx';
import { currentMonth } from '../utils/dates.js';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import BudgetProgress from '../components/ui/BudgetProgress.jsx';
import CategoryIcon from '../components/ui/CategoryIcon.jsx';
import BudgetForm from '../components/forms/BudgetForm.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState(false), [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const loader = useCallback(async () => { const [budget, categories] = await Promise.all([api.getBudget(month), api.listCategories()]); return { data: { data: { budget: budget.data.data, categories: categories.data.data.categories } } }; }, [month]);
  const resource = useResource(loader);
  const budget = resource.data?.budget;
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01'));
  return <div className="page-stack"><PageHeader eyebrow="A PLAN YOU CAN FEEL GOOD ABOUT" title="Budgets" description="Spend with intention. Leave room for life."><Button onClick={() => setEditing(true)} disabled={!resource.data}>{budget?.hasBudget ? <Pencil size={17} /> : <Plus size={17} />}{budget?.hasBudget ? 'Edit budget' : 'Set budget'}</Button></PageHeader>
    <div className="max-w-xs"><Input label="Budget month" type="month" value={month} onChange={(e) => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) setMonth(e.target.value); }} /></div>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : !budget.hasBudget ? <Card><EmptyState title={'Make a plan for ' + monthLabel} description="Set your monthly limit and get a heads-up as your spending grows." action={() => setEditing(true)} actionLabel="Set your budget" /></Card> : <>
      <Card className="max-w-3xl"><div className="flex justify-between items-start mb-6 gap-3"><div className="flex gap-3 items-center"><span className="bg-primary-tint text-primary p-3 rounded-xl"><PiggyBank size={24} /></span><div><h2 className="card-title">{monthLabel}</h2><p className="muted mt-1">Overall spending plan</p></div></div><button type="button" className="icon-button" aria-label="Delete monthly budget" onClick={() => setDeleting(true)}><Trash2 size={18} /></button></div><BudgetProgress budget={budget} /></Card>
      <div><div className="flex flex-wrap justify-between gap-3 items-center mb-4"><div><h2 className="text-lg font-semibold">A closer look by category</h2><p className="muted mt-1">Individual limits. One bigger plan.</p></div><Button variant="secondary" onClick={() => setEditing(true)}><Plus size={16} />Manage limits</Button></div>{budget.categories.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{budget.categories.map((item) => <Card key={item.category}><div className="flex gap-3 items-center mb-5"><CategoryIcon category={item.category} /><h3 className="font-semibold text-sm">{item.category}</h3></div><BudgetProgress budget={item} /></Card>)}</div> : <Card><p className="muted">Add a category limit for the areas you want to keep a closer eye on.</p><Button variant="ghost" className="mt-3 !text-primary" onClick={() => setEditing(true)}>Add category limits</Button></Card>}</div>
    </>}
    {editing && resource.data && <BudgetForm month={monthLabel} budget={budget} categories={resource.data.categories} onClose={() => setEditing(false)} onSave={async (values) => { await api.upsertBudget(month, values); resource.refetch(); }} />}
    {deleting && <ConfirmDialog title="Delete this monthly budget?" message="Your transactions stay in place. You can create a new budget for this month at any time." onClose={() => setDeleting(false)} onConfirm={async () => { await api.deleteBudget(month); resource.refetch(); toast('Budget deleted'); }} />}
  </div>;
}
