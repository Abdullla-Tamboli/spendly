import Card from './Card.jsx';
export default function StatCard({ label, value, note, icon: Icon, tone = 'neutral', featured = false }) {
  const color = tone === 'income' ? 'text-income bg-income-tint' : tone === 'expense' ? 'text-expense bg-expense-tint' : 'text-primary bg-primary-tint';
  return <Card className={featured ? '!bg-primary !border-primary text-white' : ''}><div className="flex justify-between items-center gap-3"><p className={'text-sm font-medium ' + (featured ? 'text-blue-100' : 'text-text-secondary')}>{label}</p>{Icon && <span className={'p-2 rounded-lg ' + (featured ? 'bg-white/15' : color)}><Icon size={18} /></span>}</div><p className="money-value tabular-nums mt-4">{value}</p><p className={'text-xs mt-3 ' + (featured ? 'text-blue-100' : 'text-text-secondary')}>{note}</p></Card>;
}
