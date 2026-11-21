import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data);
      const from = location.state?.from;
      navigate(from ? from.pathname + (from.search || '') : '/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      setError('root', { message: msg });
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-3">Make room for what matters.</h1>
          <p className="text-text-secondary mt-3">Sign in to see your money in one place.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <div role="alert" className="text-sm text-expense bg-expense-tint rounded-btn px-3 py-2">
              {errors.root.message}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-sm text-center text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
