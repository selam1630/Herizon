import type {
  Answer,
  Article,
  ArticleCategory,
  Comment,
  ExpertTopic,
  Post,
  PostCategory,
  Question,
  User,
} from '@/lib/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
let accessToken: string | null = null;
let refreshInFlight: Promise<User> | null = null;
let lastRefreshFailureAt = 0;
const REFRESH_RETRY_COOLDOWN_MS = 5000;

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

type ApiQuestion = {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  question: string;
  topic: ExpertTopic;
  timestamp: string;
  answerCount: number;
  isAnonymous: boolean;
  targetExpertId?: string | null;
  targetExpertName?: string | null;
};

type ApiAnswer = {
  id: string;
  questionId: string;
  expertId: string;
  expert: string;
  expertAvatar: string;
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
  isAdmin: boolean;
  isPremium: boolean;
  premiumUntil: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  isExpert: boolean;
  isAdmin: boolean;
  createdAt: Date;
};

export type AdminCommunityPost = {
  id: string;
  content: string;
  category: PostCategory;
  timestamp: Date;
  isAnonymous: boolean;
  author: string;
};

export type AdminExpertQuestion = {
  id: string;
  question: string;
  topic: ExpertTopic;
  timestamp: Date;
  isAnonymous: boolean;
  author: string;
};

export type VerifiedExpert = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  pricing: {
    chat: number | null;
    voice: number | null;
    video: number | null;
  };
};

export type ExpertApplicationStatus = 'pending' | 'approved' | 'rejected';

export type ExpertApplication = {
  id: string;
  userId: string;
  specialty: string;
  credentials: string;
  motivation: string;
  evidencePhotos: string[];
  pricing: {
    chat: number | null;
    voice: number | null;
    video: number | null;
  };
  status: ExpertApplicationStatus;
  reviewedNote: string;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminExpertApplication = ExpertApplication & {
  userName: string;
  userEmail: string;
};

export type ExpertArticleSubmission = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  readTime: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedNote: string;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export type AdminPendingArticle = {
  id: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  tags: string[];
  readTime: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedNote: string;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorEmail: string;
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

function toQuestion(item: ApiQuestion): Question {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
  };
}

function toAnswer(item: ApiAnswer): Answer {
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
    isAdmin: user.isAdmin,
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil ? new Date(user.premiumUntil) : null,
    bookmarks: [],
  };
}

function toAdminUser(user: Omit<AdminUser, 'createdAt'> & { createdAt: string }): AdminUser {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
  };
}

function toExpertApplication(
  item: Omit<ExpertApplication, 'reviewedAt' | 'createdAt' | 'updatedAt'> & {
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
): ExpertApplication {
  return {
    ...item,
    reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function getAccessToken(): Promise<string> {
  await ensureAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }
  return accessToken;
}

export async function fetchArticles(): Promise<Article[]> {
  const response = await authRequest('/api/v1/articles', {
    method: 'GET',
  });

  const data = (await response.json()) as { articles?: ApiArticle[]; message?: string };
  if (response.status === 403) {
    return [];
  }
  if (!response.ok || !data.articles) {
    throw new Error(data.message || `Failed to load articles: ${response.status}`);
  }

  return data.articles.map(toArticle);
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
  const now = Date.now();
  if (lastRefreshFailureAt && now - lastRefreshFailureAt < REFRESH_RETRY_COOLDOWN_MS) {
    throw new Error('Not authenticated');
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = (await response.json()) as AuthPayload | ErrorPayload;
  if (!response.ok) {
    setAccessToken(null);
    lastRefreshFailureAt = Date.now();
    const message = (data as ErrorPayload).message || 'Failed to refresh session';
    throw new Error(message);
  }

  const payload = data as AuthPayload;
  setAccessToken(payload.accessToken);
  lastRefreshFailureAt = 0;
  return toUser(payload.user);
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
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

export async function fetchExpertData(): Promise<{
  questions: Question[];
  answers: Record<string, Answer[]>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/experts/questions`, {
    cache: 'no-store',
  });

  const data = (await response.json()) as {
    questions?: ApiQuestion[];
    answers?: ApiAnswer[];
    message?: string;
  };

  if (!response.ok || !data.questions || !data.answers) {
    throw new Error(data.message || 'Failed to fetch expert data');
  }

  const answersByQuestion: Record<string, Answer[]> = {};
  for (const answer of data.answers.map(toAnswer)) {
    if (!answersByQuestion[answer.questionId]) {
      answersByQuestion[answer.questionId] = [];
    }
    answersByQuestion[answer.questionId].push(answer);
  }

  return {
    questions: data.questions.map(toQuestion),
    answers: answersByQuestion,
  };
}

export async function createExpertQuestion(body: {
  question: string;
  topic: ExpertTopic;
  isAnonymous: boolean;
  targetExpertId?: string | null;
}): Promise<Question> {
  const response = await authRequest('/api/v1/experts/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { question?: ApiQuestion; message?: string };
  if (!response.ok || !data.question) {
    throw new Error(data.message || 'Failed to create expert question');
  }

  return toQuestion(data.question);
}

export async function fetchVerifiedExperts(): Promise<VerifiedExpert[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/experts/verified`, {
    cache: 'no-store',
  });

  const data = (await response.json()) as { experts?: VerifiedExpert[]; message?: string };
  if (!response.ok || !data.experts) {
    throw new Error(data.message || 'Failed to load verified experts');
  }

  return data.experts;
}

export async function fetchMyExpertApplication(): Promise<ExpertApplication | null> {
  const response = await authRequest('/api/v1/experts/applications/me', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    application?: (Omit<ExpertApplication, 'reviewedAt' | 'createdAt' | 'updatedAt'> & {
      reviewedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }) | null;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load expert application');
  }

  if (!data.application) {
    return null;
  }

  return toExpertApplication(data.application);
}

export async function createExpertApplication(body: {
  specialty: string;
  credentials: string;
  motivation?: string;
  evidencePhotos?: string[];
}): Promise<ExpertApplication> {
  const response = await authRequest('/api/v1/experts/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    application?: Omit<ExpertApplication, 'reviewedAt' | 'createdAt' | 'updatedAt'> & {
      reviewedAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    message?: string;
  };

  if (!response.ok || !data.application) {
    throw new Error(data.message || 'Failed to submit expert application');
  }

  return toExpertApplication(data.application);
}

function toExpertArticleSubmission(
  item: Omit<ExpertArticleSubmission, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
    reviewedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
  }
): ExpertArticleSubmission {
  return {
    ...item,
    reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    createdAt: new Date(item.createdAt),
  };
}

function toAdminPendingArticle(
  item: Omit<AdminPendingArticle, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
    reviewedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
  }
): AdminPendingArticle {
  return {
    ...item,
    reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    createdAt: new Date(item.createdAt),
  };
}

export async function createExpertArticle(body: {
  title: string;
  excerpt?: string;
  content: string;
  category: ArticleCategory;
  tags?: string[];
}): Promise<ExpertArticleSubmission> {
  const response = await authRequest('/api/v1/experts/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    article?: Omit<ExpertArticleSubmission, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
      reviewedAt: string | null;
      publishedAt: string | null;
      createdAt: string;
    };
    message?: string;
  };

  if (!response.ok || !data.article) {
    throw new Error(data.message || 'Failed to submit expert article');
  }

  return toExpertArticleSubmission(data.article);
}

export async function fetchMyExpertArticles(): Promise<ExpertArticleSubmission[]> {
  const response = await authRequest('/api/v1/experts/articles/me', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    articles?: Array<Omit<ExpertArticleSubmission, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
      reviewedAt: string | null;
      publishedAt: string | null;
      createdAt: string;
    }>;
    message?: string;
  };
  if (!response.ok || !data.articles) {
    throw new Error(data.message || 'Failed to load your submitted articles');
  }

  return data.articles.map(toExpertArticleSubmission);
}

export async function fetchAdminUsers(onlyUnverifiedExperts = false): Promise<AdminUser[]> {
  const suffix = onlyUnverifiedExperts ? '?onlyUnverifiedExperts=true' : '';
  const response = await authRequest(`/api/v1/admin/users${suffix}`, {
    method: 'GET',
  });

  const data = (await response.json()) as {
    users?: Array<Omit<AdminUser, 'createdAt'> & { createdAt: string }>;
    message?: string;
  };
  if (!response.ok || !data.users) {
    throw new Error(data.message || 'Failed to load admin users');
  }

  return data.users.map(toAdminUser);
}

export async function updateUserRoles(
  userId: string,
  updates: { isExpert?: boolean; isAdmin?: boolean }
): Promise<AdminUser> {
  const response = await authRequest(`/api/v1/admin/users/${userId}/roles`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = (await response.json()) as {
    user?: Omit<AdminUser, 'createdAt'> & { createdAt: string };
    message?: string;
  };
  if (!response.ok || !data.user) {
    throw new Error(data.message || 'Failed to update user role');
  }

  return toAdminUser(data.user);
}

export async function fetchAdminCommunityPosts(): Promise<AdminCommunityPost[]> {
  const response = await authRequest('/api/v1/admin/community/posts', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    posts?: Array<Omit<AdminCommunityPost, 'timestamp'> & { timestamp: string }>;
    message?: string;
  };
  if (!response.ok || !data.posts) {
    throw new Error(data.message || 'Failed to load admin community posts');
  }

  return data.posts.map((post) => ({
    ...post,
    timestamp: new Date(post.timestamp),
  }));
}

export async function deleteAdminCommunityPost(postId: string): Promise<void> {
  const response = await authRequest(`/api/v1/admin/community/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    throw new Error(data.message || 'Failed to delete community post');
  }
}

export async function fetchAdminExpertQuestions(): Promise<AdminExpertQuestion[]> {
  const response = await authRequest('/api/v1/admin/experts/questions', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    questions?: Array<Omit<AdminExpertQuestion, 'timestamp'> & { timestamp: string }>;
    message?: string;
  };
  if (!response.ok || !data.questions) {
    throw new Error(data.message || 'Failed to load admin expert questions');
  }

  return data.questions.map((question) => ({
    ...question,
    timestamp: new Date(question.timestamp),
  }));
}

export async function deleteAdminExpertQuestion(questionId: string): Promise<void> {
  const response = await authRequest(`/api/v1/admin/experts/questions/${questionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    throw new Error(data.message || 'Failed to delete expert question');
  }
}

export async function fetchAdminExpertApplications(): Promise<AdminExpertApplication[]> {
  const response = await authRequest('/api/v1/admin/experts/applications', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    applications?: Array<
      Omit<AdminExpertApplication, 'reviewedAt' | 'createdAt' | 'updatedAt'> & {
        reviewedAt: string | null;
        createdAt: string;
        updatedAt: string;
      }
    >;
    message?: string;
  };
  if (!response.ok || !data.applications) {
    throw new Error(data.message || 'Failed to load expert applications');
  }

  return data.applications.map((item) => ({
    ...toExpertApplication(item),
    userName: item.userName,
    userEmail: item.userEmail,
  }));
}

export async function fetchAdminPendingArticles(): Promise<AdminPendingArticle[]> {
  const response = await authRequest('/api/v1/admin/articles/pending', {
    method: 'GET',
  });

  const data = (await response.json()) as {
    articles?: Array<Omit<AdminPendingArticle, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
      reviewedAt: string | null;
      publishedAt: string | null;
      createdAt: string;
    }>;
    message?: string;
  };
  if (!response.ok || !data.articles) {
    throw new Error(data.message || 'Failed to load pending articles');
  }

  return data.articles.map(toAdminPendingArticle);
}

export async function reviewAdminArticle(
  articleId: string,
  review: { decision: 'approved' | 'rejected'; reviewedNote?: string }
): Promise<AdminPendingArticle> {
  const response = await authRequest(`/api/v1/admin/articles/${articleId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });

  const data = (await response.json()) as {
    article?: Omit<AdminPendingArticle, 'reviewedAt' | 'publishedAt' | 'createdAt'> & {
      reviewedAt: string | null;
      publishedAt: string | null;
      createdAt: string;
    };
    message?: string;
  };
  if (!response.ok || !data.article) {
    throw new Error(data.message || 'Failed to review article');
  }

  return toAdminPendingArticle(data.article);
}

export async function reviewAdminExpertApplication(
  applicationId: string,
  review: { decision: 'approved' | 'rejected'; reviewedNote?: string }
): Promise<AdminExpertApplication> {
  const response = await authRequest(`/api/v1/admin/experts/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });

  const data = (await response.json()) as {
    application?: Omit<AdminExpertApplication, 'reviewedAt' | 'createdAt' | 'updatedAt'> & {
      reviewedAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    message?: string;
  };
  if (!response.ok || !data.application) {
    throw new Error(data.message || 'Failed to review application');
  }

  return {
    ...toExpertApplication(data.application),
    userName: data.application.userName,
    userEmail: data.application.userEmail,
  };
}

export type ExpertPricing = {
  applicationId: string;
  chat: number | null;
  voice: number | null;
  video: number | null;
};

export type PaymentBreakdown = {
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  platformFee: number;
  expertAmount: number;
  discountPercent?: number;
  premiumApplied?: boolean;
};

export type PaymentInitializeResponse = {
  checkoutUrl?: string;
  txRef: string;
  currency?: string;
  paymentProvider?: string;
  promptSent?: boolean;
  customerMessage?: string;
  checkoutRequestId?: string;
  pricing?: PaymentBreakdown;
  amount?: number;
  premiumDays?: number;
};

export type ConsultationMessage = {
  id: string;
  txRef: string;
  senderUserId: string;
  senderName: string;
  content: string;
  createdAt: Date;
};

export async function fetchMyExpertPricing(): Promise<ExpertPricing> {
  const response = await authRequest('/api/v1/experts/me/pricing', {
    method: 'GET',
  });

  const data = (await response.json()) as { pricing?: ExpertPricing; message?: string };
  if (!response.ok || !data.pricing) {
    throw new Error(data.message || 'Failed to load expert pricing');
  }

  return data.pricing;
}

export async function updateMyExpertPricing(body: {
  chat: number;
  voice: number;
  video: number;
}): Promise<ExpertPricing> {
  const response = await authRequest('/api/v1/experts/me/pricing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { pricing?: ExpertPricing; message?: string };
  if (!response.ok || !data.pricing) {
    throw new Error(data.message || 'Failed to update expert pricing');
  }

  return data.pricing;
}

export async function initializePremiumPayment(body: {
  phoneNumber?: string;
  paymentProvider?: 'mpesa' | 'chapa';
}): Promise<PaymentInitializeResponse> {
  const response = await authRequest('/api/v1/payments/premium/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as PaymentInitializeResponse & { message?: string; error?: string };
  if (!response.ok || !data.txRef) {
    throw new Error(data.error || data.message || 'Failed to initialize premium payment');
  }

  return data;
}

export async function initializeExpertCommunicationPayment(body: {
  expertId: string;
  mode: 'chat' | 'voice' | 'video';
  phoneNumber?: string;
  paymentProvider?: 'mpesa' | 'chapa';
}): Promise<PaymentInitializeResponse> {
  const response = await authRequest('/api/v1/payments/expert-communication/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as PaymentInitializeResponse & { message?: string; error?: string };
  if (!response.ok || !data.txRef) {
    throw new Error(data.error || data.message || 'Failed to initialize expert communication payment');
  }

  return data;
}

export async function verifyPayment(txRef: string): Promise<{
  txRef: string;
  status: string;
  kind: 'premium_subscription' | 'expert_consultation';
  paymentProvider?: string;
  serviceType?: 'chat' | 'voice' | 'video' | 'premium' | null;
  expertUserId?: string | null;
  expertName?: string | null;
  pricing: PaymentBreakdown;
}> {
  const response = await authRequest(`/api/v1/payments/${encodeURIComponent(txRef)}/verify`, {
    method: 'POST',
  });

  const data = (await response.json()) as {
    txRef?: string;
    status?: string;
    kind?: 'premium_subscription' | 'expert_consultation';
    paymentProvider?: string;
    serviceType?: 'chat' | 'voice' | 'video' | 'premium' | null;
    expertUserId?: string | null;
    expertName?: string | null;
    pricing?: PaymentBreakdown;
    message?: string;
  };
  if (!response.ok || !data.txRef || !data.status || !data.kind || !data.pricing) {
    throw new Error(data.message || 'Failed to verify payment');
  }

  return {
    txRef: data.txRef,
    status: data.status,
    kind: data.kind,
    paymentProvider: data.paymentProvider,
    serviceType: data.serviceType,
    expertUserId: data.expertUserId,
    expertName: data.expertName,
    pricing: data.pricing,
  };
}

export async function fetchConsultationMessages(txRef: string): Promise<ConsultationMessage[]> {
  const response = await authRequest(`/api/v1/payments/${encodeURIComponent(txRef)}/messages`, {
    method: 'GET',
  });
  const data = (await response.json()) as {
    messages?: Array<{
      id: string;
      txRef: string;
      senderUserId: string;
      senderName: string;
      content: string;
      createdAt: string;
    }>;
    message?: string;
  };

  if (!response.ok || !data.messages) {
    throw new Error(data.message || 'Failed to fetch consultation messages');
  }

  return data.messages.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));
}

export async function sendConsultationMessage(txRef: string, content: string): Promise<ConsultationMessage> {
  const response = await authRequest(`/api/v1/payments/${encodeURIComponent(txRef)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = (await response.json()) as {
    message?: string;
    chatMessage?: {
      id: string;
      txRef: string;
      senderUserId: string;
      senderName: string;
      content: string;
      createdAt: string;
    };
  };

  if (!response.ok || !data.chatMessage) {
    throw new Error(data.message || 'Failed to send consultation message');
  }

  return {
    ...data.chatMessage,
    createdAt: new Date(data.chatMessage.createdAt),
  };
}
