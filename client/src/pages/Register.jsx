import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed';
      setError('root', { message: msg });
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="eyebrow">A FRESH START</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-3">A little clarity goes a long way.</h1>
          <p className="text-text-secondary mt-3">Create your account and start with your first transaction.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <div role="alert" className="text-sm text-expense bg-expense-tint rounded-btn px-3 py-2">
              {errors.root.message}
            </div>
          )}

          <Input
            label="Name"
            type="text"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-sm text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
