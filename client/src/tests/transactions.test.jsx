import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TransactionForm from '../components/forms/TransactionForm.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';
import Transactions from '../pages/Transactions.jsx';
import BudgetProgress from '../components/ui/BudgetProgress.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { toInputDate } from '../utils/dates.js';
import * as txApi from '../api/transactions.js';
import * as resources from '../api/resources.js';
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { name: 'Alex', currency: 'USD' } }) }));
vi.mock('../api/transactions.js', () => ({ listTransactions: vi.fn(), deleteTransaction: vi.fn(), exportCsv: vi.fn() }));
vi.mock('../api/resources.js', () => ({ listAccounts: vi.fn(), listCategories: vi.fn(), getCapabilities: vi.fn(), createCategory: vi.fn() }));
const accounts = [{ _id: 'cash', name: 'Cash' }];
const categories = [{ name: 'Food', type: 'expense' }, { name: 'Salary', type: 'income' }];
const transaction = { _id: '1', type: 'expense', category: 'Food', amount: 25, note: 'Lunch', date: '2026-07-01', account: accounts[0] };
const wrap = (element) => render(<MemoryRouter><ToastProvider>{element}</ToastProvider></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks();
  resources.listAccounts.mockResolvedValue({ data: { data: { accounts } } });
  resources.listCategories.mockResolvedValue({ data: { data: { categories } } });
  txApi.listTransactions.mockResolvedValue({ data: { data: [transaction], pagination: { page: 1, total: 1, limit: 20, totalPages: 1 } } });
});
describe('Transaction form', () => {
  it('defaults to today, rejects invalid amounts and reveals recurring fields', async () => {
    const submit = vi.fn();
    wrap(<TransactionForm accounts={accounts} categories={categories} onSubmit={submit} />);
    expect(screen.getByLabelText('Date')).toHaveValue(toInputDate(new Date()));
    await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(await screen.findByText('Enter an amount greater than zero')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByLabelText('Make this recurring'));
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('End date (optional)')).toBeInTheDocument();
  });
  it('submits a numeric amount and recurring settings without form-only fields', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    wrap(<TransactionForm accounts={accounts} categories={categories} onSubmit={submit} />);
    await userEvent.type(screen.getByLabelText('Amount'), '25.50');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Food');
    await userEvent.click(screen.getByLabelText('Make this recurring'));
    await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ amount: 25.5, type: 'expense', category: 'Food', account: 'cash', recurring: { enabled: true, frequency: 'monthly' } }), null));
    expect(submit.mock.calls[0][0]).not.toHaveProperty('recurringEnabled');
  });
});
describe('Transaction list', () => {
  it('renders transactions and their signed amounts', () => { wrap(<TransactionList transactions={[transaction]} />); expect(screen.getAllByText('Lunch').length).toBeGreaterThan(0); expect(screen.getAllByText('-$25.00').length).toBeGreaterThan(0); });
  it('shows loading state', () => { wrap(<TransactionList loading />); expect(screen.getByRole('status')).toHaveAccessibleName('Loading data'); });
  it('shows empty state with action', () => { const add = vi.fn(); wrap(<TransactionList transactions={[]} onAdd={add} />); expect(screen.getByRole('button', { name: 'Add a transaction' })).toBeInTheDocument(); });
  it('offers retry on an error', async () => { const retry = vi.fn(); wrap(<TransactionList error="Unable to load" onRetry={retry} />); await userEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(retry).toHaveBeenCalled(); });
  it('requests a new backend page when a type filter changes', async () => {
    wrap(<Transactions />);
    await screen.findByText('Transaction history');
    await userEvent.selectOptions(screen.getByLabelText('Transaction type filter'), 'income');
    await waitFor(() => expect(txApi.listTransactions).toHaveBeenLastCalledWith({ type: 'income' }));
  });
});
describe('Budget progress', () => {
  it.each([[50, 'info'], [75, 'warning'], [90, 'danger']])('shows the server message at %s percent', (percent, level) => {
    wrap(<BudgetProgress budget={{ overall: 100, spent: percent, remaining: 100 - percent, percentUsed: percent, level, message: 'You have used ' + percent + '% of your July budget.' }} />);
    expect(screen.getByText('You have used ' + percent + '% of your July budget.')).toBeInTheDocument();
  });
  it('formats the exceeded amount and caps the visual progress', () => {
    wrap(<BudgetProgress budget={{ overall: 100, spent: 125, remaining: -25, percentUsed: 125, level: 'exceeded' }} />);
    expect(screen.getByText('Budget exceeded by $25.00.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
