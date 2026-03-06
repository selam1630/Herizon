import type { Article, ArticleCategory } from '@/lib/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type ApiArticle = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  author: string;
  readTime: number;
  timestamp: string;
};

function toArticle(item: ApiArticle): Article {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
  };
}

export async function fetchArticles(): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/articles`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load articles: ${response.status}`);
  }

  const data = (await response.json()) as ApiArticle[];
  return data.map(toArticle);
}
