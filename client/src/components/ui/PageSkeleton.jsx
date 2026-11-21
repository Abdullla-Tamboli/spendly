export default function PageSkeleton() {
  return <div role="status" aria-label="Loading data" className="space-y-6 animate-pulse"><div className="h-10 w-48 rounded-lg bg-slate-200" /><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-card bg-white border border-border" />)}</div><div className="h-72 rounded-card bg-white border border-border" /><span className="sr-only">Loading data</span></div>;
}
