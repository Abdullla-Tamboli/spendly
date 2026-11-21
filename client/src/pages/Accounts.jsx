import { useState } from 'react';
import { Plus, Wallet, Landmark, CreditCard, PiggyBank, Pencil, Trash2 } from 'lucide-react';
import { z } from 'zod';
import * as api from '../api/resources.js';
import useResource from '../hooks/useResource.js';
import useCurrency from '../hooks/useCurrency.js';
import { useToast } from '../context/ToastContext.jsx';
import { accountTypes } from '../utils/validation.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import FormDialog from '../components/forms/FormDialog.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
const schema = z.object({ name: z.string().trim().min(1, 'Enter an account name').max(40), type: z.enum(['cash', 'bank', 'credit_card', 'wallet', 'savings']) });
const icons = { cash: Wallet, bank: Landmark, credit_card: CreditCard, wallet: Wallet, savings: PiggyBank };
export default function Accounts() {
  const resource = useResource(api.listAccounts);
  const money = useCurrency();
  const toast = useToast();
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  return <div className="page-stack"><PageHeader eyebrow="EVERY ACCOUNT, ONE PLACE" title="Accounts & wallets" description="Keep an eye on your money, wherever you keep it."><Button onClick={() => setEditor({})}><Plus size={18} />Add account</Button></PageHeader>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : <>
      <Card className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center"><div><p className="muted">Combined balance</p><p className="text-3xl sm:text-4xl tabular-nums font-semibold mt-3">{money(resource.data.combinedTotal)}</p></div><p className="text-sm text-text-secondary max-w-sm leading-relaxed">The total of your income minus expenses across {resource.data.accounts.length} accounts. Balances update with each transaction.</p></Card>
      {!resource.data.accounts.length ? <EmptyState title="A home for your money" description="Add a bank account, wallet, or savings account to get started." action={() => setEditor({})} actionLabel="Add account" /> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{resource.data.accounts.map((account) => { const Icon = icons[account.type] || Wallet; return <Card key={account._id}><div className="flex justify-between items-start"><span className="p-3 rounded-xl text-primary bg-primary-tint"><Icon size={24} /></span><div className="flex"><button type="button" className="icon-button" aria-label={'Edit ' + account.name} onClick={() => setEditor(account)}><Pencil size={16} /></button><button type="button" className="icon-button" aria-label={'Delete ' + account.name} onClick={() => setDeleting(account)}><Trash2 size={16} /></button></div></div><h2 className="font-semibold text-lg mt-5 break-words">{account.name}</h2><p className="muted mt-1">{accountTypes.find((a) => a.value === account.type)?.label}</p><p className={'text-3xl tabular-nums font-semibold mt-6 break-all ' + (account.balance < 0 ? 'text-expense' : '')}>{money(account.balance)}</p><p className="text-xs text-text-secondary mt-2">Current balance</p></Card>; })}</div>}
    </>}
    {editor && <FormDialog title={editor._id ? 'Edit account' : 'Add an account'} schema={schema} initial={{ name: editor.name || '', type: editor.type || 'bank' }} fields={[{ name: 'name', label: 'Account name', placeholder: 'e.g. Everyday account', maxLength: 40 }, { name: 'type', label: 'Account type', options: accountTypes }]} onClose={() => setEditor(null)} onSave={async (values) => { if (editor._id) await api.updateAccount(editor._id, values); else await api.createAccount(values); resource.refetch(); }} successMessage={editor._id ? 'Account updated' : 'Account created'} submitLabel={editor._id ? 'Save changes' : 'Create account'} />}
    {deleting && <ConfirmDialog title={'Delete ' + deleting.name + '?'} message="Only accounts without transactions or recurring rules can be deleted." onClose={() => setDeleting(null)} onConfirm={async () => { await api.deleteAccount(deleting._id); resource.refetch(); toast('Account deleted'); }} />}
  </div>;
}
