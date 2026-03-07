'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { refreshSession, signIn, signUp } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Mode = 'signin' | 'signup';

export function AuthGate({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const setAuthenticatedUser = useAppStore((s) => s.setAuthenticatedUser);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const user = await refreshSession();
        setAuthenticatedUser(user);
      } catch (_error) {
        // User is not logged in or refresh token is invalid.
      } finally {
        setBootstrapping(false);
      }
    }

    bootstrapAuth();
  }, [setAuthenticatedUser]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload =
        mode === 'signup'
          ? await signUp({ name, email, password })
          : await signIn({ email, password });

      setAuthenticatedUser(payload.user);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border border-border shadow-sm">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'signup'
              ? 'Join Herizone community with your email.'
              : 'Welcome back. Sign in to continue.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Sign in'}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 text-sm text-primary hover:underline"
            onClick={() => {
              setError('');
              setMode(mode === 'signup' ? 'signin' : 'signup');
            }}
          >
            {mode === 'signup'
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
