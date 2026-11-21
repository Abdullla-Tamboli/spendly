import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Landmark } from 'lucide-react';
import { getDashboard, listAccounts, listGoals } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import useResource from '../hooks/useResource.js';
import useCurrency from '../hooks/useCurrency.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import BudgetProgress from '../components/ui/BudgetProgress.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import CashflowChart from '../components/charts/CashflowChart.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';
import TransactionModal from '../components/transactions/TransactionModal.jsx';
const load = async () => { const [dashboard, accounts, goals] = await Promise.all([getDashboard(), listAccounts(), listGoals()]); return { data: { data: { ...dashboard.data.data, accounts: accounts.data.data.accounts, goals: goals.data.data } } }; };
export default function Dashboard() {
  const { user } = useAuth();
  const resource = useResource(load);
  const [adding, setAdding] = useState(false);
  const money = useCurrency();
  const data = resource.data;
  return <div className="page-stack">
    <PageHeader eyebrow="YOUR FINANCIAL PICTURE" title={'Welcome back, ' + (user?.name?.split(' ')[0] || 'there') + '.'} description="A little clarity for the day ahead."><Button onClick={() => setAdding(true)}><Plus size={18} />Add transaction</Button></PageHeader>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"><StatCard label="Total balance" value={money(data.balance)} note="Across all your accounts · all time" icon={Wallet} featured /><StatCard label="Total income" value={money(data.totalIncome)} note="Everything coming in · all time" icon={TrendingUp} tone="income" /><StatCard label="Total expenses" value={money(data.totalExpenses)} note="Everything going out · all time" icon={TrendingDown} tone="expense" /><StatCard label="Budget remaining" value={data.budget.hasBudget ? money(data.budget.remaining) : 'Not set yet'} note={data.budget.hasBudget ? data.budget.percentUsed + '% of this month’s budget used' : 'Give your spending a little direction'} icon={PiggyBank} /></div>
      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] gap-6"><Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="card-title">Cash flow</h2><p className="muted mt-1">A six-month view of money in and out.</p></div><span className="text-xs text-text-secondary bg-bg border border-border px-3 py-2 rounded-btn">Last 6 months</span></div><CashflowChart data={data.overview} /></Card><Card><div className="flex justify-between items-center mb-6 gap-2"><h2 className="card-title">Monthly budget</h2><Link to="/budgets" className="text-sm text-primary font-medium">{data.budget.hasBudget ? 'Manage' : 'Set budget'}</Link></div>{data.budget.hasBudget ? <BudgetProgress budget={data.budget} /> : <div className="py-6 text-center"><PiggyBank size={32} className="text-primary mx-auto mb-4" /><h3 className="font-semibold">A plan for every month</h3><p className="muted my-3 leading-relaxed">Set a spending limit and see how much room you have left.</p><Link to="/budgets" className="inline-block text-sm font-semibold text-primary mt-2">Create your first budget</Link></div>}</Card></div>
      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] gap-6"><Card className="!p-0 overflow-hidden"><div className="p-5 flex items-center justify-between gap-3"><div><h2 className="card-title">Recent transactions</h2><p className="muted mt-1">Your latest activity, at a glance.</p></div><Link to="/transactions" className="text-primary text-sm font-medium shrink-0">View all</Link></div><TransactionList transactions={data.recentTransactions} compact onAdd={() => setAdding(true)} /></Card><div className="space-y-6"><Card><div className="flex justify-between items-center mb-5"><h2 className="card-title">Your accounts</h2><Link className="text-primary text-sm font-medium" to="/accounts">Manage</Link></div><div className="space-y-4">{data.accounts.slice(0, 4).map((a) => <div className="flex items-center gap-3" key={a._id}><span className="p-2.5 rounded-xl bg-bg text-text-secondary">{a.type === 'cash' ? <Wallet size={18} /> : <Landmark size={18} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{a.name}</p><p className="text-xs text-text-secondary capitalize mt-1">{a.type.replace('_', ' ')}</p></div><p className="font-semibold text-sm tabular-nums break-all text-right">{money(a.balance)}</p></div>)}{!data.accounts.length && <Link to="/accounts" className="text-primary text-sm">Add your first account</Link>}</div></Card><Card><div className="flex justify-between items-center mb-5"><h2 className="card-title">A little closer</h2><Link className="text-primary text-sm font-medium" to="/goals">All goals</Link></div>{data.goals.length ? data.goals.slice(0, 2).map((goal) => <div key={goal._id} className="mb-4 last:mb-0"><div className="flex justify-between text-sm mb-2 gap-2"><span className="font-medium truncate">{goal.name}</span><span className="text-primary font-semibold">{goal.progress}%</span></div><ProgressBar value={goal.progress} level="info" label={goal.name + ' progress'} /><p className="text-xs text-text-secondary mt-2">{money(goal.currentAmount)} of {money(goal.targetAmount)}</p></div>) : <div className="flex gap-3 items-start"><Target size={24} className="text-primary shrink-0" /><div><p className="text-sm font-medium">What are you saving for?</p><p className="muted mt-2">Give your next goal a name and start making progress.</p><Link to="/goals" className="text-primary font-medium text-sm inline-block mt-3">Create a savings goal</Link></div></div>}</Card></div></div>
    </>}
    {adding && <TransactionModal onClose={() => setAdding(false)} onSaved={resource.refetch} />}
  </div>;
}
