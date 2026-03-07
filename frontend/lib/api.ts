import type { Article, ArticleCategory, Comment, Post, PostCategory, User } from '@/lib/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
let accessToken: string | null = null;

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

type ApiPost = {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  category: PostCategory;
  content: string;
  timestamp: string;
  likes: number;
  commentCount: number;
  isAnonymous: boolean;
  isLiked: boolean;
};

type ApiComment = {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  isExpert: boolean;
  createdAt: string;
};

type AuthPayload = {
  accessToken: string;
  user: ApiUser;
};

type ErrorPayload = {
  message?: string;
};

function toArticle(item: ApiArticle): Article {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
  };
}

function toPost(item: ApiPost): Post {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
  };
}

function toComment(item: ApiComment): Comment {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
  };
}

function toUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    isExpert: user.isExpert,
    bookmarks: [],
  };
}

function setAccessToken(token: string | null) {
  accessToken = token;
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

async function ensureAccessToken() {
  if (!accessToken) {
    await refreshSession();
  }
}

async function authRequest(path: string, init: RequestInit) {
  await ensureAccessToken();

  const doRequest = async () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await doRequest();
  if (response.status === 401) {
    await refreshSession();
    response = await doRequest();
  }

  return response;
}

async function postAuth(endpoint: 'signup' | 'signin', body: { name?: string; email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as AuthPayload | ErrorPayload;
  if (!response.ok) {
    const message = (data as ErrorPayload).message || `Auth request failed with status ${response.status}`;
    throw new Error(message);
  }

  const payload = data as AuthPayload;
  setAccessToken(payload.accessToken);

  return {
    user: toUser(payload.user),
  };
}

export function signUp(body: { name: string; email: string; password: string }) {
  return postAuth('signup', body);
}

export function signIn(body: { email: string; password: string }) {
  return postAuth('signin', body);
}

export async function refreshSession(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = (await response.json()) as AuthPayload | ErrorPayload;
  if (!response.ok) {
    setAccessToken(null);
    const message = (data as ErrorPayload).message || 'Failed to refresh session';
    throw new Error(message);
  }

  const payload = data as AuthPayload;
  setAccessToken(payload.accessToken);
  return toUser(payload.user);
}

export async function signOutSession() {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchCurrentUser(): Promise<User> {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  const data = (await response.json()) as { user?: ApiUser; message?: string };
  if (!response.ok || !data.user) {
    throw new Error(data.message || 'Failed to fetch current user');
  }

  return toUser(data.user);
}

export async function fetchCommunityData(): Promise<{ posts: Post[]; comments: Record<string, Comment[]> }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/community/posts`, {
    cache: 'no-store',
  });

  const data = (await response.json()) as { posts?: ApiPost[]; comments?: ApiComment[]; message?: string };
  if (!response.ok || !data.posts || !data.comments) {
    throw new Error(data.message || 'Failed to fetch community data');
  }

  const commentsByPost: Record<string, Comment[]> = {};
  for (const item of data.comments.map(toComment)) {
    if (!commentsByPost[item.postId]) {
      commentsByPost[item.postId] = [];
    }
    commentsByPost[item.postId].push(item);
  }

  return {
    posts: data.posts.map(toPost),
    comments: commentsByPost,
  };
}

export async function createCommunityPost(body: {
  category: PostCategory;
  content: string;
  isAnonymous: boolean;
}): Promise<Post> {
  const response = await authRequest('/api/v1/community/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { post?: ApiPost; message?: string };
  if (!response.ok || !data.post) {
    throw new Error(data.message || 'Failed to create post');
  }

  return toPost(data.post);
}

export async function createCommunityComment(postId: string, content: string): Promise<{ comment: Comment; commentCount: number }> {
  const response = await authRequest(`/api/v1/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const data = (await response.json()) as { comment?: ApiComment; commentCount?: number; message?: string };
  if (!response.ok || !data.comment) {
    throw new Error(data.message || 'Failed to create comment');
  }

  return {
    comment: toComment(data.comment),
    commentCount: Number(data.commentCount || 0),
  };
}
