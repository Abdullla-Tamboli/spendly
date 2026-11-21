import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as api from '../api/resources.js';
import useResource, { errorMessage } from '../hooks/useResource.js';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import PageSkeleton from '../components/ui/PageSkeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import CategoryIcon from '../components/ui/CategoryIcon.jsx';
import FormDialog from '../components/forms/FormDialog.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AED'];
const profileSchema = z.object({ name: z.string().trim().min(2, 'Use at least 2 characters').max(60), currency: z.enum(currencies) });
const iconKeys = ['tag', 'shopping-cart', 'utensils', 'car', 'home', 'heart', 'book', 'music', 'gift', 'briefcase', 'trending-up', 'dollar-sign', 'credit-card', 'repeat', 'zap', 'coffee', 'plane', 'smartphone'];
export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const resource = useResource(api.listCategories);
  const [editor, setEditor] = useState(null), [deleting, setDeleting] = useState(null), [signingOut, setSigningOut] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name, currency: user.currency } });
  const saveProfile = async (values) => { try { const res = await api.updateProfile(values); updateUser(res.data.data.user); toast('Profile updated'); } catch (err) { setError('root', { message: errorMessage(err) }); } };
  const custom = resource.data?.categories.filter((c) => !c.isDefault) || [];
  return <div className="page-stack"><PageHeader eyebrow="MAKE YOURSELF AT HOME" title="Settings" description="The little details that make Spendly yours." />
    <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start"><div className="space-y-6"><Card><h2 className="card-title">Your profile</h2><p className="muted mt-1 mb-6">Your name and preferred display currency.</p><form onSubmit={handleSubmit(saveProfile)} noValidate className="space-y-4">{errors.root && <p role="alert" className="text-expense text-sm">{errors.root.message}</p>}<Input label="Name" error={errors.name?.message} {...register('name')} /><Input label="Email address" value={user.email} disabled hint="Your email is used to sign in." /><Select label="Display currency" options={currencies.map((value) => ({ value, label: value }))} {...register('currency')} error={errors.currency?.message} /><p className="text-xs text-text-secondary leading-relaxed">Changing currency changes how amounts are displayed. It does not convert the amounts already recorded.</p><Button type="submit" loading={isSubmitting}>Save profile</Button></form></Card><Card><h2 className="card-title">Your session</h2><p className="muted mt-2 mb-5">Sign out of Spendly on this device.</p><Button variant="secondary" loading={signingOut} onClick={async () => { setSigningOut(true); await logout(); toast('Signed out successfully'); }}><LogOut size={17} />Sign out</Button></Card></div>
    <Card><div className="flex flex-wrap justify-between gap-3 items-center mb-5"><div><h2 className="card-title">Custom categories</h2><p className="muted mt-1">Organize things your way.</p></div><Button variant="secondary" size="sm" onClick={() => setEditor({})}><Plus size={16} />Add category</Button></div>{resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : !custom.length ? <EmptyState title="A category for your everyday" description="The defaults are ready to use. Add your own whenever you need something more specific." action={() => setEditor({})} actionLabel="Create category" /> : <div className="divide-y divide-border">{custom.map((category) => <div key={category._id} className="flex gap-3 items-center py-3"><CategoryIcon category={category.name} type={category.type} /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{category.name}</p><p className="text-xs capitalize text-text-secondary mt-1">{category.type} · {category.icon}</p></div><button type="button" className="icon-button" aria-label={'Edit ' + category.name} onClick={() => setEditor(category)}><Pencil size={16} /></button><button type="button" className="icon-button" aria-label={'Delete ' + category.name} onClick={() => setDeleting(category)}><Trash2 size={16} /></button></div>)}</div>}</Card></div>
    {editor && <FormDialog title={editor._id ? 'Edit category' : 'Create category'} schema={z.object({ name: z.string().trim().min(1, 'Enter a category name').max(30), icon: z.enum(iconKeys), ...(editor._id ? {} : { type: z.enum(['income', 'expense']) }) })} initial={{ name: editor.name || '', icon: editor.icon || 'tag', ...(editor._id ? {} : { type: 'expense' }) }} fields={[{ name: 'name', label: 'Category name', maxLength: 30 }, ...(!editor._id ? [{ name: 'type', label: 'Category type', options: [{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }] }] : []), { name: 'icon', label: 'Icon', options: iconKeys.map((value) => ({ value, label: value.replaceAll('-', ' ') })) }]} onClose={() => setEditor(null)} onSave={async (values) => { if (editor._id) await api.updateCategory(editor._id, values); else await api.createCategory(values); resource.refetch(); }} successMessage="Category saved" submitLabel={editor._id ? 'Save changes' : 'Create category'} />}
    {deleting && <ConfirmDialog title="Delete category?" message="Categories used by transactions, budgets, or recurring rules cannot be deleted. Renaming keeps those references up to date." onClose={() => setDeleting(null)} onConfirm={async () => { await api.deleteCategory(deleting._id); resource.refetch(); toast('Category deleted'); }} />}
  </div>;
}
