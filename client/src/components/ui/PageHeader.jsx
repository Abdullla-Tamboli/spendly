export default function PageHeader({ eyebrow, title, description, children }) {
  return <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="min-w-0">{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>{description && <p className="text-text-secondary text-sm sm:text-base mt-2 leading-relaxed">{description}</p>}</div>{children && <div className="flex flex-wrap gap-2 shrink-0">{children}</div>}</div>;
}
