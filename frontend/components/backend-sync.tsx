'use client';

import { useEffect } from 'react';
import { fetchArticles, fetchCommunityData, fetchExpertData } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export function BackendSync() {
  const setArticles = useAppStore((s) => s.setArticles);
  const setPosts = useAppStore((s) => s.setPosts);
  const setPostComments = useAppStore((s) => s.setPostComments);
  const setQuestions = useAppStore((s) => s.setQuestions);
  const setAnswers = useAppStore((s) => s.setAnswers);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [articles, community, experts] = await Promise.all([
          fetchArticles(),
          fetchCommunityData(),
          fetchExpertData(),
        ]);
        if (active) {
          setArticles(articles);
          setPosts(community.posts);
          setPostComments(community.comments);
          setQuestions(experts.questions);
          setAnswers(experts.answers);
        }
      } catch (error) {
        console.error('Backend sync failed, using local fallback data.', error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [setAnswers, setArticles, setPostComments, setPosts, setQuestions]);

  return null;
}
