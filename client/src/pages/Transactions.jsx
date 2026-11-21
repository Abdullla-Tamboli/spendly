import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Download, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as transactionApi from '../api/transactions.js';
import { listAccounts, listCategories } from '../api/resources.js';
import useResource, { errorMessage } from '../hooks/useResource.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';
import TransactionModal from '../components/transactions/TransactionModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';

const loadFilters = async () => { const [accounts, categories] = await Promise.all([listAccounts(), listCategories()]); return { data: { data: { accounts: accounts.data.data.accounts, categories: categories.data.data.categories } } }; };
const filterLabels = { type: 'Type', category: 'Category', account: 'Account', from: 'From', to: 'To', minAmount: 'Min', maxAmount: 'Max', search: 'Search' };
export default function Transactions() {
  const [query, setQuery] = useSearchParams();
  const queryString = query.toString();
  const params = useMemo(() => Object.fromEntries(new URLSearchParams(queryString)), [queryString]);
  const loader = useCallback(() => transactionApi.listTransactions(params), [params]);
  const resource = useResource(loader);
  const metadata = useResource(loadFilters);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [draftSearch, setDraftSearch] = useState({ value: params.search || '', source: params.search || '' });
  const search = draftSearch.source === (params.search || '') ? draftSearch.value : params.search || '';
  const setSearch = (value) => setDraftSearch({ value, source: params.search || '' });
  const searchTimer = useRef(null);
  const toast = useToast();
  useEffect(() => { clearTimeout(searchTimer.current); }, [params.search]);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const setFilter = useCallback((key, value) => {
    setQuery((previous) => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; });
  }, [setQuery]);
  const changeSearch = (value) => { setSearch(value); clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => setFilter('search', value.trim()), 300); };
  const active = Object.entries(params).filter(([key, value]) => filterLabels[key] && value);
  const exportCsv = async () => {
    setExporting(true);
    try {
      const filters = { ...params }; delete filters.page; delete filters.limit;
      const res = await transactionApi.exportCsv(filters);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'spendly-transactions.csv'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('CSV exported');
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setExporting(false); }
  };
  const pagination = resource.pagination;
  const categories = [...new Set((metadata.data?.categories || []).filter((c) => !params.type || c.type === params.type).map((c) => c.name))];
  return <div className="page-stack">
    <PageHeader eyebrow="YOUR MONEY, IN DETAIL" title="Transactions" description="Every little expense. Every bit of progress."><Button variant="secondary" onClick={exportCsv} loading={exporting}><Download size={17} />Export CSV</Button><Button onClick={() => setEditor({})}><Plus size={18} />Add transaction</Button></PageHeader>
    <Card className="!p-4 sm:!p-5 space-y-4"><div className="flex flex-col sm:flex-row gap-3"><div className="flex-1 relative"><Search size={18} className="absolute left-3.5 top-3.5 text-text-secondary" /><input aria-label="Search transactions" placeholder="Search notes, categories, or amounts" className="field !pl-10" value={search} onChange={(e) => changeSearch(e.target.value)} maxLength={100} /></div><div className="sm:w-44"><Select aria-label="Transaction type filter" value={params.type || ''} onChange={(e) => setFilter('type', e.target.value)} options={[{ value: '', label: 'All transactions' }, { value: 'expense', label: 'Expenses' }, { value: 'income', label: 'Income' }]} /></div><Button variant="secondary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={17} />Filters{active.length > 0 && <span className="text-primary font-semibold">{active.length}</span>}</Button></div>
      {expanded && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 border-t border-border pt-4"><Select label="Category filter" value={params.category || ''} options={[{ value: '', label: 'All categories' }, ...categories.map((v) => ({ value: v, label: v }))]} onChange={(e) => setFilter('category', e.target.value)} /><Select label="Account filter" value={params.account || ''} options={[{ value: '', label: 'All accounts' }, ...(metadata.data?.accounts || []).map((a) => ({ value: a._id, label: a.name }))]} onChange={(e) => setFilter('account', e.target.value)} /><Input label="From date" type="date" value={params.from || ''} onChange={(e) => setFilter('from', e.target.value)} /><Input label="To date" type="date" value={params.to || ''} onChange={(e) => setFilter('to', e.target.value)} /><Input label="Minimum amount" type="number" min="0" step="0.01" value={params.minAmount || ''} onChange={(e) => setFilter('minAmount', e.target.value)} /><Input label="Maximum amount" type="number" min="0" step="0.01" value={params.maxAmount || ''} onChange={(e) => setFilter('maxAmount', e.target.value)} /></div>}
      {metadata.error && <ErrorState message={metadata.error} onRetry={metadata.refetch} />}
      {active.length > 0 && <div className="flex flex-wrap gap-2 items-center">{active.map(([key, value]) => <button type="button" key={key} onClick={() => { if (key === 'search') clearTimeout(searchTimer.current); setFilter(key, ''); }} className="inline-flex max-w-full items-center gap-2 rounded-md bg-primary-tint px-2.5 py-1.5 text-xs text-primary font-medium"><span className="truncate">{filterLabels[key]}: {key === 'account' ? metadata.data?.accounts.find((a) => a._id === value)?.name || value : value}</span><X size={13} className="shrink-0" /></button>)}<button type="button" className="text-sm text-text-secondary underline px-2 py-1" onClick={() => { clearTimeout(searchTimer.current); setSearch(''); setQuery({}); }}>Clear filters</button></div>}
    </Card>
    <Card className="!p-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="card-title">Transaction history <span className="text-text-secondary font-normal ml-1">{pagination ? '(' + pagination.total + ')' : ''}</span></h2><Select aria-label="Sort transactions" className="!min-h-9 !py-1.5" value={params.sort || 'date_desc'} onChange={(e) => setFilter('sort', e.target.value)} options={[{ value: 'date_desc', label: 'Newest first' }, { value: 'date_asc', label: 'Oldest first' }, { value: 'amount_desc', label: 'Highest amount' }, { value: 'amount_asc', label: 'Lowest amount' }]} /></div>
      <TransactionList transactions={resource.data || []} loading={resource.loading} error={resource.error} onRetry={resource.refetch} onAdd={() => setEditor({})} onEdit={(tx) => setEditor({ transaction: tx })} onDelete={setDeleting} />
      {pagination && <div className="p-4 border-t border-border flex flex-wrap justify-between items-center gap-3"><span className="text-sm text-text-secondary">{pagination.total ? Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total) : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions</span><div className="flex items-center gap-2"><Button variant="secondary" size="sm" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => setFilter('page', String(pagination.page - 1))}><ChevronLeft size={16} /></Button><span className="text-sm">Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><Button variant="secondary" size="sm" aria-label="Next page" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilter('page', String(pagination.page + 1))}><ChevronRight size={16} /></Button></div></div>}
    </Card>
    {editor && <TransactionModal transaction={editor.transaction} onClose={() => setEditor(null)} onSaved={() => { resource.refetch(); metadata.refetch(); }} />}
    {deleting && <ConfirmDialog title="Delete transaction?" message="This transaction will be removed and your balances and budgets will be recalculated. Its recurring schedule, if any, will stay active." onClose={() => setDeleting(null)} onConfirm={async () => { await transactionApi.deleteTransaction(deleting._id); toast('Transaction deleted'); if (resource.data?.length === 1 && Number(params.page) > 1) setFilter('page', String(Number(params.page) - 1)); else resource.refetch(); }} />}
  </div>;
}
