import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Unable to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to Calisthenics Log
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Track your bodyweight training progress
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md bg-red-900/50 border border-red-800 p-3 text-center text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 active:bg-indigo-700"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-950 px-2 text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 active:bg-gray-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleLoading ? 'Connecting…' : 'Google'}
        </button>

        <div className="space-y-2 text-center text-sm">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Sign up
            </Link>
          </p>
          <p>
            <Link
              to="/reset-password"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
