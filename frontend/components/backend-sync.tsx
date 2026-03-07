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
        const community = await fetchCommunityData();
        if (active) {
          setPosts(community.posts);
          setPostComments(community.comments);
        }
      } catch (error) {
        console.error('Community sync failed.', error);
      }

      try {
        const experts = await fetchExpertData();
        if (active) {
          setQuestions(experts.questions);
          setAnswers(experts.answers);
        }
      } catch (error) {
        console.error('Experts sync failed.', error);
      }

      try {
        const articles = await fetchArticles();
        if (active) {
          setArticles(articles);
        }
      } catch (error) {
        if (active) {
          setArticles([]);
        }
        console.error('Articles sync failed.', error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [setAnswers, setArticles, setPostComments, setPosts, setQuestions]);

  return null;
}
