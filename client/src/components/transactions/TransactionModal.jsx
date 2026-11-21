import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import PageSkeleton from '../ui/PageSkeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import TransactionForm from '../forms/TransactionForm.jsx';
import useResource, { errorMessage } from '../../hooks/useResource.js';
import { listAccounts, listCategories, getCapabilities } from '../../api/resources.js';
import { createTransaction, updateTransaction, uploadAttachment } from '../../api/transactions.js';
import { useToast } from '../../context/ToastContext.jsx';
const load = async () => {
  const [accounts, categories, capabilities] = await Promise.all([listAccounts(), listCategories(), getCapabilities()]);
  return { data: { data: { accounts: accounts.data.data.accounts, categories: categories.data.data.categories, attachmentsEnabled: capabilities.data.data.attachmentsEnabled } } };
};
export default function TransactionModal({ transaction, recurringDefault, onClose, onSaved }) {
  const resource = useResource(load);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const save = async (payload, file) => {
    setBusy(true);
    try {
      const res = transaction ? await updateTransaction(transaction._id, payload) : await createTransaction(payload);
      if (file) {
        try { await uploadAttachment(res.data.data.transaction._id, file); }
        catch (err) { toast('Transaction saved, but receipt upload failed: ' + errorMessage(err) + '. Edit it to retry the receipt.', 'error', 8000); onSaved(); onClose(); return; }
      }
      toast(transaction ? 'Transaction updated' : 'Transaction added');
      onSaved(); onClose();
    } finally { setBusy(false); }
  };
  return <Modal open title={transaction ? 'Edit transaction' : 'Add a transaction'} onClose={onClose} busy={busy}>
    {resource.loading ? <PageSkeleton /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refetch} /> : !resource.data.accounts.length ? <p className="muted">You need an account first. <Link to="/accounts" className="text-primary font-medium">Create an account</Link></p> : <TransactionForm initial={transaction} recurringDefault={recurringDefault} {...resource.data} onSubmit={save} onCancel={onClose} />}
  </Modal>;
}
