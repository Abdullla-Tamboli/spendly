import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage } from '../../hooks/useResource.js';
export default function ConfirmDialog({ title = 'Delete this item?', message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const confirm = async () => {
    setBusy(true); setError('');
    try { await onConfirm(); onClose(); } catch (err) { const msg = errorMessage(err); setError(msg); toast(msg, 'error'); } finally { setBusy(false); }
  };
  return <Modal open title={title} onClose={onClose} busy={busy}><p className="text-text-secondary leading-relaxed">{message}</p>{error && <p role="alert" className="text-expense text-sm mt-3">{error}</p>}<div className="flex justify-end gap-3 mt-6"><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button variant="danger" loading={busy} onClick={confirm}>Delete</Button></div></Modal>;
}
