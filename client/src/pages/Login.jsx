import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as authApi from '../api/auth.js';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const passwordSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const otpEmailSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

const otpVerifySchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain numbers only'),
});

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'verify'
  const [otpEmail, setOtpEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Password form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(passwordSchema) });

  // OTP Email form
  const {
    register: registerOtpEmail,
    handleSubmit: handleOtpEmailSubmit,
    formState: { errors: otpEmailErrors },
  } = useForm({ resolver: zodResolver(otpEmailSchema) });

  // OTP Verify form
  const {
    register: registerOtpVerify,
    handleSubmit: handleOtpVerifySubmit,
    formState: { errors: otpVerifyErrors, isSubmitting: isVerifyingOtp },
  } = useForm({ resolver: zodResolver(otpVerifySchema) });

  const redirectAfterLogin = () => {
    const from = location.state?.from;
    navigate(from ? from.pathname + (from.search || '') : '/', { replace: true });
  };

  const onPasswordSubmit = async (data) => {
    try {
      await login(data);
      redirectAfterLogin();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      setError('root', { message: msg });
    }
  };

  const onRequestOtp = async (data) => {
    setOtpError('');
    setIsSendingOtp(true);
    try {
      await authApi.sendOtp(data.email);
      setOtpEmail(data.email);
      setOtpStep('verify');
      toast('Verification code sent to your email');
    } catch (err) {
      setOtpError(err.response?.data?.error?.message || 'Failed to send code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onResendOtp = async () => {
    if (!otpEmail) return;
    setOtpError('');
    setIsSendingOtp(true);
    try {
      await authApi.sendOtp(otpEmail);
      toast('A new code has been sent to your email');
    } catch (err) {
      setOtpError(err.response?.data?.error?.message || 'Failed to resend code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onVerifyOtpSubmit = async (data) => {
    setOtpError('');
    try {
      await loginWithOtp({ email: otpEmail, otp: data.otp });
      toast('Signed in successfully');
      redirectAfterLogin();
    } catch (err) {
      setOtpError(err.response?.data?.error?.message || 'Invalid or expired code');
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

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-bg border border-border rounded-lg text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setOtpError('');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
              mode === 'password'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <KeyRound size={16} />
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setOtpError('');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
              mode === 'otp'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Mail size={16} />
            Email Code (OTP)
          </button>
        </div>

        {mode === 'password' ? (
          /* Password Form */
          <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate className="space-y-4">
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
        ) : (
          /* OTP Form */
          <div className="space-y-4">
            {otpError && (
              <div role="alert" className="text-sm text-expense bg-expense-tint rounded-btn px-3 py-2">
                {otpError}
              </div>
            )}

            {otpStep === 'email' ? (
              <form onSubmit={handleOtpEmailSubmit(onRequestOtp)} noValidate className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  error={otpEmailErrors.email?.message}
                  {...registerOtpEmail('email')}
                />
                <Button
                  type="submit"
                  loading={isSendingOtp}
                  disabled={isSendingOtp}
                  className="w-full flex items-center justify-center gap-2"
                >
                  Send verification code
                  <ArrowRight size={16} />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerifySubmit(onVerifyOtpSubmit)} noValidate className="space-y-4">
                <div className="bg-bg border border-border rounded-btn p-3 text-sm">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Code sent to:</span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('email')}
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <ArrowLeft size={12} />
                      Change
                    </button>
                  </div>
                  <div className="font-semibold text-text-primary mt-1 truncate">{otpEmail}</div>
                </div>

                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className="tracking-widest text-center text-lg font-mono"
                  error={otpVerifyErrors.otp?.message}
                  {...registerOtpVerify('otp')}
                />

                <Button
                  type="submit"
                  loading={isVerifyingOtp}
                  disabled={isVerifyingOtp}
                  className="w-full"
                >
                  Verify & Sign in
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={isSendingOtp}
                    className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={isSendingOtp ? 'animate-spin' : ''} />
                    Didn&apos;t get a code? Resend
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

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
