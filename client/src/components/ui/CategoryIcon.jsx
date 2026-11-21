import { Utensils, Plane, ShoppingBag, Receipt, House, Tv, Heart, BookOpen, Repeat2, BriefcaseBusiness, Laptop, Building2, TrendingUp, Gift, Tag } from 'lucide-react';
const icons = { Food: Utensils, Travel: Plane, Shopping: ShoppingBag, Bills: Receipt, Rent: House, Entertainment: Tv, Health: Heart, Education: BookOpen, Subscription: Repeat2, Salary: BriefcaseBusiness, Freelance: Laptop, Business: Building2, Investment: TrendingUp, Gift };
const colors = { Food: 'bg-orange-50 text-orange-700', Travel: 'bg-sky-50 text-sky-700', Shopping: 'bg-violet-50 text-violet-700', Bills: 'bg-amber-50 text-amber-700', Rent: 'bg-blue-50 text-blue-700', Health: 'bg-rose-50 text-rose-700' };
export default function CategoryIcon({ category, type = 'expense' }) {
  const Icon = icons[category] || Tag;
  return <span className={'inline-flex shrink-0 items-center justify-center w-10 h-10 rounded-xl ' + (type === 'income' ? 'bg-income-tint text-income' : colors[category] || 'bg-primary-tint text-primary')}><Icon size={19} strokeWidth={1.8} /></span>;
}
