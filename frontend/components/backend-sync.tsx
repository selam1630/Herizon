'use client';

import { useEffect } from 'react';
import { fetchArticles, fetchCommunityData } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export function BackendSync() {
  const setArticles = useAppStore((s) => s.setArticles);
  const setPosts = useAppStore((s) => s.setPosts);
  const setPostComments = useAppStore((s) => s.setPostComments);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [articles, community] = await Promise.all([fetchArticles(), fetchCommunityData()]);
        if (active) {
          setArticles(articles);
          setPosts(community.posts);
          setPostComments(community.comments);
        }
      } catch (error) {
        console.error('Backend sync failed, using local fallback data.', error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [setArticles, setPosts, setPostComments]);

  return null;
}
