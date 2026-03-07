// ─── API Client ───────────────────────────────────────────────────────────────
// Typed fetch wrapper. All calls go through here so auth headers
// and error handling are applied in one place.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Token storage (localStorage, client-only) ─────────────────────────────────
export const TOKEN_KEY = 'herizone_token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.error ?? data.message ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// Like request() but NEVER sends an Authorization header (for public/guest endpoints)
async function guestRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.error ?? data.message ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  profilePicture: string | null;
  bio: string | null;
  isAdmin: boolean;
  isExpert: boolean;
}

export const authApi = {
  register: (data: { name?: string; email: string; password: string }) =>
    api.post<{ token: string; user: AuthUser }>('/api/auth/register', data),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password }),
  getSession: () => api.get<{ user: AuthUser }>('/api/auth/session'),
  signOut: () => api.post('/api/auth/signout'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get<{ user: AuthUser & { children: unknown[]; pregnancyInfo: unknown[] } }>('/api/users/me'),
  updateMe: (data: { name?: string; bio?: string; profilePicture?: string }) =>
    api.patch<{ user: AuthUser }>('/api/users/me', data),
  addChild: (data: { name?: string; birthDate?: string }) =>
    api.post('/api/users/children', data),
  addPregnancy: (data: { dueDate?: string; trimester?: number }) =>
    api.post('/api/users/pregnancy', data),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export interface ApiPost {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: { id: string; name: string; profilePicture: string | null } | null;
  _count?: { comments: number; likes: number };
}

export interface ApiComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; profilePicture: string | null };
}

export const postsApi = {
  getPosts: (params?: { category?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    // Public — no auth token needed; guests can browse
    return guestRequest<{ posts: ApiPost[]; total: number }>(`/api/posts?${qs}`);
  },
  createPost: (data: { content: string; category: string; isAnonymous: boolean }) =>
    api.post<{ post: ApiPost }>('/api/posts', data),
  getPost: (id: string) =>
    // Public — guests can read a single post + its comments
    guestRequest<{ post: ApiPost & { comments: ApiComment[] } }>(`/api/posts/${id}`),
  deletePost: (id: string) => api.delete(`/api/posts/${id}`),
  likePost: (id: string) => api.post(`/api/posts/${id}/like`),
  unlikePost: (id: string) => api.delete(`/api/posts/${id}/like`),
  reportPost: (id: string, reason?: string) =>
    api.post(`/api/posts/${id}/report`, { reason }),
  addComment: (postId: string, content: string) =>
    api.post<{ comment: ApiComment }>(`/api/posts/${postId}/comments`, { content }),
  deleteComment: (id: string) => api.delete(`/api/comments/${id}`),
  reportComment: (id: string, reason?: string) =>
    api.post(`/api/comments/${id}/report`, { reason }),
};

// ── Articles ──────────────────────────────────────────────────────────────────
export type ArticleStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface ApiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  createdAt: string;
  author: { id: string; name: string | null; profilePicture?: string | null } | null;
}

export const articlesApi = {
  getArticles: (params?: { category?: string; search?: string; mine?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.mine) qs.set('mine', 'true');
    // mine=true requires auth; otherwise public
    return params?.mine
      ? api.get<{ articles: ApiArticle[]; total: number }>(`/api/articles?${qs}`)
      : guestRequest<{ articles: ApiArticle[]; total: number }>(`/api/articles?${qs}`);
  },
  getArticle: (id: string) =>
    guestRequest<{ article: ApiArticle }>(`/api/articles/${id}`),
  getPendingArticles: () =>
    api.get<{ articles: ApiArticle[] }>('/api/articles/pending'),
  createArticle: (data: { title: string; content: string; category: string; tags: string[] }) =>
    api.post<{ article: ApiArticle }>('/api/articles', data),
  updateArticle: (id: string, data: { title?: string; content?: string; category?: string; tags?: string[] }) =>
    api.patch<{ article: ApiArticle }>(`/api/articles/${id}`, data),
  publishArticle: (id: string) =>
    api.patch<{ article: ApiArticle }>(`/api/articles/${id}/publish`, {}),
  rejectArticle: (id: string) =>
    api.patch<{ article: ApiArticle }>(`/api/articles/${id}/reject`, {}),
  deleteArticle: (id: string) => api.delete<{ message: string }>(`/api/articles/${id}`),
  bookmark: (id: string) => api.post(`/api/articles/${id}/bookmark`),
  unbookmark: (id: string) => api.delete(`/api/articles/${id}/bookmark`),
  getBookmarks: () => api.get<{ bookmarks: ApiArticle[] }>('/api/bookmarks'),
};

// ── Expert Applications ───────────────────────────────────────────────────────
export interface ApiExpertApplication {
  id: string;
  userId: string;
  bio: string;
  credentials: string;
  specialty: string;
  yearsOfExperience: number;
  licenseNumber: string | null;
  priceMin: number;
  priceMax: number;
  agreeToTerms: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string; profilePicture: string | null };
}

export interface ApiExpert {
  id: string;
  name: string | null;
  profilePicture: string | null;
  bio: string | null;
  specialty: string | null;
  yearsOfExperience: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

export const expertApplicationsApi = {
  apply: (data: {
    bio: string;
    credentials: string;
    specialty: string;
    yearsOfExperience: number;
    licenseNumber?: string;
    priceMin: number;
    priceMax: number;
    agreeToTerms: boolean;
  }) =>
    api.post<{ application: ApiExpertApplication }>('/api/expert-applications', data),
  getMyApplication: () =>
    api.get<{ application: ApiExpertApplication | null }>('/api/expert-applications/me'),
  getAll: () =>
    api.get<{ applications: ApiExpertApplication[] }>('/api/expert-applications'),
  approve: (id: string) =>
    api.patch<{ message: string }>(`/api/expert-applications/${id}/approve`, {}),
  reject: (id: string, reviewNote?: string) =>
    api.patch<{ message: string }>(`/api/expert-applications/${id}/reject`, { reviewNote }),
  getExperts: () =>
    guestRequest<{ experts: ApiExpert[] }>('/api/expert-applications/experts'),
};

// ── Expert Q&A ────────────────────────────────────────────────────────────────
export interface ApiQuestion {
  id: string;
  question: string;
  topic: string;
  createdAt: string;
  user: { id: string; name: string; profilePicture: string | null };
  _count?: { answers: number };
}

export interface ApiAnswer {
  id: string;
  answer: string;
  createdAt: string;
  expert: { id: string; name: string; profilePicture: string | null; isExpert: boolean };
}

export const questionsApi = {
  getQuestions: (params?: { topic?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.topic) qs.set('topic', params.topic);
    if (params?.search) qs.set('search', params.search);
    return api.get<{ questions: ApiQuestion[]; total: number }>(`/api/questions?${qs}`);
  },
  getQuestion: (id: string) =>
    api.get<{ question: ApiQuestion & { answers: ApiAnswer[] } }>(`/api/questions/${id}`),
  createQuestion: (data: { question: string; topic: string }) =>
    api.post<{ question: ApiQuestion }>('/api/questions', data),
  answerQuestion: (questionId: string, answer: string) =>
    api.post<{ answer: ApiAnswer }>(`/api/questions/${questionId}/answers`, { answer }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ApiChatMessage {
  id: string;
  content: string;
  confidence?: number;
  sourceCount?: number;
  isAi: boolean;
  createdAt: string;
}

export const chatApi = {
  sendMessage: (message: string) =>
    api.post<{ message: ApiChatMessage }>('/api/chat', { message }),
  getHistory: () =>
    api.get<{ messages: (ApiChatMessage & { feedback: { isHelpful: boolean }[] })[] }>(
      '/api/chat/history'
    ),
  submitFeedback: (messageId: string, isHelpful: boolean) =>
    api.post(`/api/chat/${messageId}/feedback`, { isHelpful }),
};

// ── Knowledge Base ────────────────────────────────────────────────────────────
export const knowledgeApi = {
  getStats: () =>
    api.get<{
      stats: {
        total: number;
        fromCommunity: number;
        fromExperts: number;
        fromArticles: number;
        avgConfidenceScore: number;
        userSatisfaction: number;
        questionsAnswered: number;
      };
    }>('/api/knowledge/stats'),
};
