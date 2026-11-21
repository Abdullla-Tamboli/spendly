import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import * as authApi from '../api/auth.js';
vi.mock('../api/auth.js', () => ({ login: vi.fn(), register: vi.fn(), getMe: vi.fn(), logout: vi.fn() }));
function renderLogin() { return render(<MemoryRouter initialEntries={['/login']}><ToastProvider><AuthProvider><Routes><Route path="/login" element={<Login />} /><Route path="/" element={<p>Dashboard loaded</p>} /></Routes></AuthProvider></ToastProvider></MemoryRouter>); }
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
describe('Login form', () => {
  it('shows field errors without sending invalid credentials', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });
  it('submits entered credentials and navigates after success', async () => {
    authApi.login.mockResolvedValue({ data: { data: { token: 'test', user: { name: 'Alex' } } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'alex@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Dashboard loaded')).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({ email: 'alex@example.com', password: 'Password1' });
  });
  it('keeps the form usable after a server error', async () => {
    authApi.login.mockRejectedValue({ response: { data: { error: { message: 'Invalid email or password' } } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'alex@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
  });
});
it('redirects unauthenticated protected routes to login', async () => {
  render(<MemoryRouter initialEntries={['/private']}><ToastProvider><AuthProvider><Routes><Route element={<ProtectedRoute />}><Route path="/private" element={<p>Private</p>} /></Route><Route path="/login" element={<p>Login destination</p>} /></Routes></AuthProvider></ToastProvider></MemoryRouter>);
  expect(await screen.findByText('Login destination')).toBeInTheDocument();
  expect(screen.queryByText('Private')).not.toBeInTheDocument();
});
