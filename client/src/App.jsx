import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Accounts = lazy(() => import('./pages/Accounts.jsx'));
const Budgets = lazy(() => import('./pages/Budgets.jsx'));
const Recurring = lazy(() => import('./pages/Recurring.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
