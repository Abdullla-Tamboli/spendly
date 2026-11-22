import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as authApi from '../api/auth.js';
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

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain numbers only'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [formData, setFormData] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const {
    handleSubmit: handleOtpSubmit,
    setValue: setFormOtpValue,
    clearErrors: clearOtpErrors,
    formState: { errors: otpErrors, isSubmitting: isVerifyingOtp },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onDetailsSubmit = async (data) => {
    setError('root', { message: '' });
    setIsSendingOtp(true);
    try {
      await authApi.sendRegistrationOtp(data.email);
      setFormData(data);
      setOtpValue('');
      setFormOtpValue('otp', '');
      clearOtpErrors();
      setOtpError('');
      setStep('otp');
      toast('Verification code sent to your email');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to send verification code';
      setError('root', { message: msg });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onResendCode = async () => {
    if (!formData?.email) return;
    setOtpError('');
    setOtpValue('');
    setFormOtpValue('otp', '');
    clearOtpErrors();
    setIsSendingOtp(true);
    try {
      await authApi.sendRegistrationOtp(formData.email);
      toast('A new verification code has been sent');
    } catch (err) {
      setOtpError(err.response?.data?.error?.message || 'Failed to resend code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onEditDetails = () => {
    setStep('details');
    setOtpValue('');
    setFormOtpValue('otp', '');
    clearOtpErrors();
    setOtpError('');
  };

  const onFinalSubmit = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Verification code must be 6 digits');
      return;
    }
    setOtpError('');
    try {
      await registerUser({ ...formData, otp: otpValue });
      toast('Account created and verified!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid or expired verification code';
      setOtpError(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="eyebrow">A FRESH START</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-3">
            {step === 'details' ? 'A little clarity goes a long way.' : 'Check your inbox.'}
          </h1>
          <p className="text-text-secondary mt-3">
            {step === 'details'
              ? 'Create your account and start with your first transaction.'
              : 'We sent a 6-digit verification code to confirm your email.'}
          </p>
        </div>

        {step === 'details' ? (
          /* Step 1: Account Information */
          <form key="step-details-form" onSubmit={handleSubmit(onDetailsSubmit)} noValidate className="space-y-4">
            {errors.root && (
              <div role="alert" className="text-sm text-expense bg-expense-tint rounded-btn px-3 py-2">
                {errors.root.message}
              </div>
            )}

            <Input
              id="register-name"
              label="Name"
              type="text"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="register-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={isSubmitting || isSendingOtp}
              disabled={isSubmitting || isSendingOtp}
              className="w-full flex items-center justify-center gap-2"
            >
              Continue to email verification
              <ArrowRight size={16} />
            </Button>
          </form>
        ) : (
          /* Step 2: Email OTP Verification */
          <form key="step-otp-form" onSubmit={handleOtpSubmit(onFinalSubmit)} noValidate className="space-y-4">
            {otpError && (
              <div role="alert" className="text-sm text-expense bg-expense-tint rounded-btn px-3 py-2">
                {otpError}
              </div>
            )}

            <div className="bg-bg border border-border rounded-btn p-3.5 text-sm flex items-start gap-3">
              <div className="p-2 bg-primary-tint text-primary rounded-lg shrink-0 mt-0.5">
                <Mail size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text-secondary text-xs">Verification code sent to</div>
                <div className="font-semibold text-text-primary truncate">{formData?.email}</div>
                <button
                  type="button"
                  onClick={onEditDetails}
                  className="text-primary hover:underline text-xs mt-1.5 inline-flex items-center gap-1 font-medium"
                >
                  <ArrowLeft size={12} /> Edit details
                </button>
              </div>
            </div>

            <Input
              key="otp-code-input"
              id="register-otp-code"
              name="spendly_email_otp"
              label="6-Digit Verification Code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={otpValue}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpValue(digitsOnly);
                setFormOtpValue('otp', digitsOnly, { shouldValidate: !!otpErrors.otp });
                if (otpError) setOtpError('');
              }}
              className="tracking-widest text-center text-xl font-mono py-2.5"
              error={otpErrors.otp?.message}
            />

            <Button
              type="submit"
              loading={isVerifyingOtp}
              disabled={isVerifyingOtp}
              className="w-full"
            >
              Verify & Create Account
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onResendCode}
                disabled={isSendingOtp}
                className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isSendingOtp ? 'animate-spin' : ''} />
                Didn&apos;t get the code? Resend
              </button>
            </div>
          </form>
        )}

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
