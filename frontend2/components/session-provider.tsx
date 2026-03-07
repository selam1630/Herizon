'use client';

import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAppStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return <>{children}</>;
}
