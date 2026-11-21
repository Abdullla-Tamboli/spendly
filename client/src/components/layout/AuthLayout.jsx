import { ChartNoAxesCombined, PiggyBank, Target } from 'lucide-react';
import Brand from './Brand.jsx';
export default function AuthLayout({ children }) {
  return <main className="min-h-screen grid lg:grid-cols-2">
    <section className="hidden lg:flex bg-primary text-white p-12 xl:p-20 flex-col justify-between">
      <Brand inverse />
      <div className="max-w-lg py-14"><p className="text-sm uppercase tracking-[.16em] text-blue-100 mb-6 font-semibold">LESS GUESSWORK. MORE CLARITY.</p><h2 className="text-5xl xl:text-6xl leading-[1.12] tracking-tight font-semibold">Your money,<br />a little clearer.</h2><p className="text-lg text-blue-100 leading-relaxed mt-6 max-w-md">Understand where it goes. Make a plan for where you want to be.</p><div className="space-y-5 mt-12">{[[ChartNoAxesCombined, 'See the whole picture', 'Your income, spending, and accounts together.'], [PiggyBank, 'Spend with a plan', 'Monthly budgets that keep you in the know.'], [Target, 'Make progress, your way', 'Build savings for the things that matter.']].map(([Icon, title, text]) => <div className="flex gap-4" key={title}><span className="p-3 h-fit bg-white/10 rounded-card"><Icon size={22} /></span><div><p className="font-semibold">{title}</p><p className="text-blue-100 text-sm mt-1">{text}</p></div></div>)}</div></div>
      <p className="text-sm text-blue-100">A calmer place for your personal finances.</p>
    </section>
    <section className="flex flex-col items-center justify-center px-6 py-10 sm:px-12 bg-white"><div className="lg:hidden mb-10"><Brand /></div>{children}<p className="text-xs text-text-secondary mt-10">Track today. Plan tomorrow.</p></section>
  </main>;
}
