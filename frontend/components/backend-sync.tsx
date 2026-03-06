'use client';

import { useEffect } from 'react';
import { fetchArticles } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export function BackendSync() {
  const setArticles = useAppStore((s) => s.setArticles);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const articles = await fetchArticles();
        if (active) {
          setArticles(articles);
        }
      } catch (error) {
        console.error('Backend sync failed, using local fallback data.', error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [setArticles]);

  return null;
}
