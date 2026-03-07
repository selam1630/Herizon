// ─── Auth helpers ─────────────────────────────────────────────────────────────
// Thin layer over authApi that manages the stored JWT.
//
// Usage:
//   const user = await register({ name, email, password });
//   const user = await login(email, password);
//   const user = await restoreSession();   // call on app boot
//   await signOut();

import { authApi, getToken, removeToken, setToken, type AuthUser } from './api';

// Re-export so callers only need one import
export { getToken, removeToken, setToken };
export type { AuthUser };

/**
 * Create a new account. Stores the JWT automatically.
 */
export async function register(data: {
  name?: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const { token, user } = await authApi.register(data);
  setToken(token);
  return user;
}

/**
 * Sign in with email + password. Stores the JWT automatically.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await authApi.login(email, password);
  setToken(token);
  return user;
}

/**
 * Validate the stored token against the server and return the current user.
 * Returns null if there is no token or it is no longer valid.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const { user } = await authApi.getSession();
    return user;
  } catch {
    removeToken();
    return null;
  }
}

/**
 * Clear local token and tell the server to invalidate the session.
 */
export async function signOut(): Promise<void> {
  try {
    await authApi.signOut();
  } finally {
    removeToken();
  }
}

