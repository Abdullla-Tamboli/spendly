import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getAnalytics } from '../api/resources.js';
import useResource from '../hooks/useResource.js';
import useCurrency from '../hooks/useCurrency.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import CategoryIcon from '../components/ui/CategoryIcon.jsx';
import CashflowChart from '../components/charts/CashflowChart.jsx';
const colors = ['#1E4FD6', '#6389E6', '#12805C', '#D69C41', '#8A67C8', '#D6403A', '#3297A8', '#8391A8'];
export default function Analytics() {
  const [range, setRange] = useState('month');
  const loader = useCallback(() => getAnalytics(range), [range]);
  const { data, loading, error, refetch } = useResource(loader);
  const money = useCurrency();
  return <div className="page-stack"><PageHeader eyebrow="THE STORY BEHIND THE NUMBERS" title="Analytics" description="Understand your habits. Make your next move with confidence." /><div role="group" aria-label="Analytics range" className="flex flex-wrap p-1 bg-white border border-border rounded-btn w-fit gap-1">{[['week', 'Week'], ['month', 'Month'], ['3months', '3 Months'], ['year', 'Year']].map(([value, label]) => <button type="button" key={value} aria-pressed={value === range} onClick={() => setRange(value)} className={'px-4 py-2 text-sm font-medium rounded-md ' + (value === range ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg')}>{label}</button>)}</div>
    {loading ? <PageSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : <>
      <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Income" value={money(data.summary.income)} note="Money received in this period" icon={TrendingUp} tone="income" /><StatCard label="Expenses" value={money(data.summary.expenses)} note="Money spent in this period" icon={TrendingDown} tone="expense" /><StatCard label="Net savings" value={money(data.summary.netSavings)} note="Your income minus expenses" icon={Wallet} featured /></div>
      <div className="grid xl:grid-cols-[minmax(280px,1fr)_minmax(0,1.5fr)] gap-6"><Card><h2 className="card-title">Where your money goes</h2><p className="muted mt-1">Expenses by category</p>{data.categoryBreakdown.length ? <><div className="h-64 relative" role="img" aria-label="Expenses by category donut chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={data.categoryBreakdown} dataKey="amount" nameKey="category" innerRadius="65%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>{data.categoryBreakdown.map((item, i) => <Cell key={item.category} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-3">{data.categoryBreakdown.slice(0, 6).map((item, i) => <div className="flex items-center gap-2 text-xs min-w-0" key={item.category}><span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} /><span className="truncate text-text-secondary">{item.category}</span><span className="ml-auto font-semibold">{item.percentage}%</span></div>)}</div></> : <div className="h-64 flex flex-col gap-3 items-center justify-center text-sm text-text-secondary"><p>No expenses in this period.</p><Link to="/transactions" className="text-primary font-medium">Add a transaction</Link></div>}</Card><Card><h2 className="card-title">Income & spending trend</h2><p className="muted mt-1">See how your money moves over time.</p><CashflowChart data={data.trend} periodKey="period" /></Card></div>
      <Card><h2 className="card-title mb-5">Spending breakdown</h2>{data.categoryBreakdown.length ? <div className="divide-y divide-border">{data.categoryBreakdown.map((item, i) => <div key={item.category} className="flex items-center gap-3 sm:gap-4 py-4"><span className="hidden sm:block w-5 text-xs text-text-secondary">{i + 1}</span><CategoryIcon category={item.category} /><span className="font-medium text-sm min-w-0 flex-1 break-words">{item.category}</span><div className="hidden sm:block w-1/3"><div className="bg-bg h-2 rounded-full"><div className="h-2 rounded-full" style={{ width: item.percentage + '%', background: colors[i % colors.length] }} /></div></div><span className="text-xs text-text-secondary w-14 text-right">{item.percentage}%</span><span className="font-semibold text-sm tabular-nums sm:w-28 text-right">{money(item.amount)}</span></div>)}</div> : <p className="muted py-8 text-center">Your category breakdown will appear when you record expenses.</p>}</Card>
    </>}
  </div>;
}
