'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { refreshSession, signIn, signUp } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Mode = 'signin' | 'signup';

export function AuthGate({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const setAuthenticatedUser = useAppStore((s) => s.setAuthenticatedUser);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const user = await refreshSession();
        setAuthenticatedUser(user);
      } catch {
        // No valid session yet.
      } finally {
        setBootstrapping(false);
      }
    }

    void bootstrapAuth();
  }, [setAuthenticatedUser]);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  const reset = () => {
    setError('');
    setName('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        mode === 'signup'
          ? await signUp({ name: name.trim() || 'New User', email, password })
          : await signIn({ email, password });

      setAuthenticatedUser(payload.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'border-0 border-b border-white/30 rounded-none bg-transparent px-0 pb-2 ' +
    'text-white placeholder:text-white/35 ' +
    'focus-visible:border-white/80 focus-visible:ring-0 focus-visible:ring-offset-0';

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/80 text-white">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/image copy.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 60%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="absolute inset-0 bg-black/20" />

      <div
        className="absolute right-0 top-0 z-10 flex h-full w-full flex-col justify-center overflow-y-auto lg:w-[44%]"
        style={{
          background: 'rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '-12px 0 60px rgba(0,0,0,0.25)',
        }}
      >
        <div className="mx-auto w-full max-w-lg space-y-8 px-10 py-12 lg:px-14">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-base text-white/55">
              {mode === 'signin'
                ? 'Please enter your details.'
                : 'Join thousands of women supporting each other.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-medium text-white/75">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={inputCls}
                  required
                  minLength={2}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-white/75">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-white/75">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className={inputCls}
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-1">
                <Label htmlFor="confirm" className="text-sm font-medium text-white/75">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="border-white/35 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor="remember" className="cursor-pointer select-none text-sm text-white/60">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm text-white/60 transition-colors hover:text-white">
                  Forgot your password?
                </button>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/45">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-white transition-colors hover:text-primary"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-white transition-colors hover:text-primary"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
