import { Wallet } from 'lucide-react';
export default function Brand({ inverse = false }) {
  return <span className="inline-flex items-center gap-2.5"><span className={'p-2 rounded-lg ' + (inverse ? 'bg-white/15 text-white' : 'bg-primary text-white')}><Wallet size={22} strokeWidth={2} /></span><span className={'text-2xl font-bold tracking-tight ' + (inverse ? 'text-white' : 'text-text-primary')}>spendly<span className={inverse ? 'text-white' : 'text-primary'}>.</span></span></span>;
}
