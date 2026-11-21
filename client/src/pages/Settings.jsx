import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast('Signed out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Profile</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><span className="font-medium text-text-primary">Name:</span> {user?.name}</p>
          <p><span className="font-medium text-text-primary">Email:</span> {user?.email}</p>
          <p><span className="font-medium text-text-primary">Currency:</span> {user?.currency}</p>
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Account</h3>
        <Button variant="danger" onClick={handleLogout}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
