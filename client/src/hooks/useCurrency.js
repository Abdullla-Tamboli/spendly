import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
export default function useCurrency() {
  const { user } = useAuth();
  return (amount) => formatCurrency(amount, user?.currency || 'USD');
}
