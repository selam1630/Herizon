import { create } from 'zustand';
import {
    articlesApi,
    chatApi,
    expertApplicationsApi,
    postsApi,
    questionsApi,
    type ApiAnswer,
    type ApiArticle,
    type ApiChatMessage,
    type ApiComment,
    type ApiExpert,
    type ApiExpertApplication,
    type ApiPost,
    type ApiQuestion,
    type AuthUser,
} from './api';
import { login as authLogin, register as authRegister, signOut as authSignOut, restoreSession } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCategory = 'pregnancy' | 'parenting' | 'health' | 'general';
export type ArticleCategory = 'pregnancy' | 'parenting' | 'health' | 'nutrition';
export type ExpertTopic = 'medical' | 'mental_health' | 'nutrition' | 'parenting';
export type View = 'home' | 'feed' | 'learn' | 'experts' | 'profile';

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  isExpert: boolean;
  isAdmin: boolean;
  bookmarks: string[];
}

export interface Post {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  category: PostCategory;
  content: string;
  timestamp: Date;
  likes: number;
  commentCount: number;
  isAnonymous: boolean;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  author: string;
  authorId: string | null;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  readTime: number;
  timestamp: Date;
}

export interface ExpertApplication {
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
  createdAt: Date;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface Expert {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  yearsOfExperience: number;
  priceMin: number;
  priceMax: number;
}

export interface Question {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  question: string;
  topic: ExpertTopic;
  timestamp: Date;
  answerCount: number;
  isAnonymous: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  expertId: string;
  expert: string;
  expertAvatar: string;
  content: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  isAi: boolean;
  timestamp: Date;
  confidence?: number;
  sourceCount?: number;
}

// ─── Mappers (API shapes → store shapes) ─────────────────────────────────────

function mapPost(p: ApiPost): Post {
  return {
    id: p.id,
    authorId: p.user?.id ?? 'anon',
    author: p.isAnonymous ? 'Anonymous' : (p.user?.name ?? 'Unknown'),
    avatar: p.user?.profilePicture ?? '/placeholder-user.jpg',
    category: p.category as PostCategory,
    content: p.content,
    timestamp: new Date(p.createdAt),
    likes: p.likeCount ?? (p._count as { likes?: number })?.likes ?? 0,
    commentCount: p.commentCount ?? (p._count as { comments?: number })?.comments ?? 0,
    isAnonymous: p.isAnonymous,
    isLiked: false,
  };
}

function mapComment(c: ApiComment, postId: string): Comment {
  return {
    id: c.id,
    postId,
    authorId: c.user.id,
    author: c.user.name,
    avatar: c.user.profilePicture ?? '/placeholder-user.jpg',
    content: c.content,
    timestamp: new Date(c.createdAt),
  };
}

function mapArticle(a: ApiArticle): Article {
  const words = a.content?.split(' ').length ?? 0;
  return {
    id: a.id,
    title: a.title,
    excerpt: a.content?.slice(0, 160) + '…',
    content: a.content,
    category: a.category as ArticleCategory,
    tags: a.tags ?? [],
    author: a.author?.name ?? 'Herizone Team',
    authorId: a.author?.id ?? null,
    status: (a.status as Article['status']) ?? 'published',
    readTime: Math.max(1, Math.round(words / 200)),
    timestamp: new Date(a.createdAt),
  };
}

function mapQuestion(q: ApiQuestion): Question {
  return {
    id: q.id,
    authorId: q.user.id,
    author: q.user.name,
    avatar: q.user.profilePicture ?? '/placeholder-user.jpg',
    question: q.question,
    topic: q.topic as ExpertTopic,
    timestamp: new Date(q.createdAt),
    answerCount: (q._count as { answers?: number })?.answers ?? 0,
    isAnonymous: false,
  };
}

function mapAnswer(a: ApiAnswer, questionId: string): Answer {
  return {
    id: a.id,
    questionId,
    expertId: a.expert.id,
    expert: a.expert.name,
    expertAvatar: a.expert.profilePicture ?? '/placeholder-user.jpg',
    content: a.answer,
    timestamp: new Date(a.createdAt),
  };
}

function mapChatMessage(m: ApiChatMessage): ChatMessage {
  return {
    id: m.id,
    content: m.content,
    isAi: m.isAi,
    timestamp: new Date(m.createdAt),
    confidence: m.confidence,
    sourceCount: m.sourceCount,
  };
}

function mapAuthUser(u: AuthUser): User {
  return {
    id: u.id,
    name: u.name ?? 'You',
    avatar: u.profilePicture ?? '/placeholder-user.jpg',
    bio: u.bio ?? '',
    isExpert: u.isExpert,
    isAdmin: u.isAdmin,
    bookmarks: [],
  };
}

function mapExpertApplication(a: ApiExpertApplication): ExpertApplication {
  return {
    id: a.id,
    userId: a.userId,
    bio: a.bio,
    credentials: a.credentials,
    specialty: a.specialty,
    yearsOfExperience: a.yearsOfExperience,
    licenseNumber: a.licenseNumber,
    priceMin: a.priceMin,
    priceMax: a.priceMax,
    agreeToTerms: a.agreeToTerms,
    status: a.status,
    reviewNote: a.reviewNote,
    createdAt: new Date(a.createdAt),
    userName: a.user?.name ?? undefined,
    userEmail: a.user?.email,
    userAvatar: a.user?.profilePicture ?? undefined,
  };
}

function mapExpert(e: ApiExpert): Expert {
  return {
    id: e.id,
    name: e.name ?? 'Expert',
    avatar: e.profilePicture ?? '/placeholder-user.jpg',
    bio: e.bio ?? '',
    specialty: e.specialty ?? '',
    yearsOfExperience: e.yearsOfExperience ?? 0,
    priceMin: e.priceMin ?? 0,
    priceMax: e.priceMax ?? 0,
  };
}

// ─── Welcome message ──────────────────────────────────────────────────────────

const welcomeMessage: ChatMessage = {
  id: 'msg-welcome',
  content:
    "Hello! I'm Bloom 🌸, your AI support assistant. I can help with questions about pregnancy, parenting, and maternal health. My answers come from our verified knowledge base of expert advice and community wisdom. How can I help you today?",
  isAi: true,
  timestamp: new Date(),
};

// ─── Store Interface ───────────────────────────────────────────────────────────

interface AppStore {
  // Navigation
  currentView: View;
  setView: (view: View) => void;

  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  register: (data: { name?: string; email: string; password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;

  // Posts
  posts: Post[];
  postsLoading: boolean;
  selectedPost: Post | null;
  postComments: Record<string, Comment[]>;
  postFilter: PostCategory | 'all';
  postSort: 'newest' | 'popular';
  postSearch: string;
  setPosts: (posts: Post[]) => void;
  fetchPosts: () => Promise<void>;
  addPost: (data: { content: string; category: PostCategory; isAnonymous: boolean }) => Promise<void>;
  selectPost: (post: Post | null) => Promise<void>;
  setPostFilter: (filter: PostCategory | 'all') => void;
  setPostSort: (sort: 'newest' | 'popular') => void;
  setPostSearch: (search: string) => void;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  getFilteredPosts: () => Post[];

  // Articles
  articles: Article[];
  articlesLoading: boolean;
  selectedArticle: Article | null;
  articleFilter: ArticleCategory | 'all';
  articleSearch: string;
  pendingArticles: Article[];
  pendingArticlesLoading: boolean;
  myExpertApplication: ExpertApplication | null;
  expertApplications: ExpertApplication[];
  experts: Expert[];
  expertsLoading: boolean;
  fetchArticles: () => Promise<void>;
  fetchMyArticles: () => Promise<void>;
  fetchPendingArticles: () => Promise<void>;
  fetchExpertApplications: () => Promise<void>;
  fetchMyApplication: () => Promise<void>;
  fetchExperts: () => Promise<void>;
  setArticleFilter: (filter: ArticleCategory | 'all') => void;
  setArticleSearch: (search: string) => void;
  selectArticle: (article: Article | null) => void;
  toggleBookmark: (articleId: string) => Promise<void>;
  getFilteredArticles: () => Article[];
  createArticle: (data: { title: string; content: string; category: ArticleCategory; tags: string[] }) => Promise<void>;
  updateArticle: (id: string, data: { title?: string; content?: string; category?: ArticleCategory; tags?: string[] }) => Promise<void>;
  publishArticle: (id: string) => Promise<void>;
  rejectArticle: (id: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  applyAsExpert: (data: {
    bio: string;
    credentials: string;
    specialty: string;
    yearsOfExperience: number;
    licenseNumber?: string;
    priceMin: number;
    priceMax: number;
    agreeToTerms: boolean;
  }) => Promise<void>;
  approveExpertApplication: (id: string) => Promise<void>;
  rejectExpertApplication: (id: string, reviewNote?: string) => Promise<void>;

  // Expert Q&A
  questions: Question[];
  questionsLoading: boolean;
  answers: Record<string, Answer[]>;
  selectedQuestion: Question | null;
  expertFilter: ExpertTopic | 'all';
  expertSearch: string;
  fetchQuestions: () => Promise<void>;
  addQuestion: (data: { question: string; topic: ExpertTopic }) => Promise<void>;
  selectQuestion: (q: Question | null) => Promise<void>;
  setExpertFilter: (filter: ExpertTopic | 'all') => void;
  setExpertSearch: (search: string) => void;
  getFilteredQuestions: () => Question[];

  // Chat
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  setChatOpen: (open: boolean) => void;
  sendChatMessage: (content: string) => Promise<void>;
  sendFeedback: (messageId: string, isHelpful: boolean) => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Navigation ─────────────────────────────────────────────────────────────
  currentView: 'home',
  setView: (view) => set({ currentView: view }),

  // ── Auth ───────────────────────────────────────────────────────────────────
  currentUser: null,
  isAuthenticated: false,
  authLoading: false,

  register: async (data) => {
    set({ authLoading: true });
    try {
      const user = await authRegister(data);
      set({ currentUser: mapAuthUser(user), isAuthenticated: true });
    } finally {
      set({ authLoading: false });
    }
  },

  login: async (email, password) => {
    set({ authLoading: true });
    try {
      const user = await authLogin(email, password);
      set({ currentUser: mapAuthUser(user), isAuthenticated: true });
    } finally {
      set({ authLoading: false });
    }
  },

  logout: async () => {
    await authSignOut();
    set({ currentUser: null, isAuthenticated: false, chatMessages: [welcomeMessage] });
  },

  restoreSession: async () => {
    set({ authLoading: true });
    try {
      const user = await restoreSession();
      if (user) {
        set({ currentUser: mapAuthUser(user), isAuthenticated: true });
        try {
          const { bookmarks } = await articlesApi.getBookmarks();
          const ids = bookmarks.map((a) => a.id);
          set((s) => ({
            currentUser: s.currentUser ? { ...s.currentUser, bookmarks: ids } : null,
          }));
        } catch {}
      }
    } finally {
      set({ authLoading: false });
    }
  },

  updateProfile: (updates) =>
    set((s) => ({
      currentUser: s.currentUser ? { ...s.currentUser, ...updates } : null,
    })),

  // ── Posts ──────────────────────────────────────────────────────────────────
  posts: [],
  postsLoading: false,
  selectedPost: null,
  postComments: {},
  postFilter: 'all',
  postSort: 'newest',
  postSearch: '',

  setPosts: (posts) => set({ posts }),

  fetchPosts: async () => {
    set({ postsLoading: true });
    try {
      const { postFilter, postSearch } = get();
      const { posts } = await postsApi.getPosts({
        category: postFilter === 'all' ? undefined : postFilter,
        search: postSearch || undefined,
      });
      set({ posts: posts.map(mapPost) });
    } catch (err) {
      console.error('fetchPosts error', err);
    } finally {
      set({ postsLoading: false });
    }
  },

  addPost: async (data) => {
    if (!get().isAuthenticated) throw new Error('AUTH_REQUIRED');
    const { post } = await postsApi.createPost(data);
    set((s) => ({ posts: [mapPost(post), ...s.posts] }));
  },

  selectPost: async (post) => {
    set({ selectedPost: post });
    if (!post) return;
    if (!get().postComments[post.id]) {
      try {
        const { post: full } = await postsApi.getPost(post.id);
        const comments = (full.comments ?? []).map((c) => mapComment(c, post.id));
        set((s) => ({ postComments: { ...s.postComments, [post.id]: comments } }));
      } catch {}
    }
  },

  setPostFilter: (filter) => set({ postFilter: filter }),
  setPostSort: (sort) => set({ postSort: sort }),
  setPostSearch: (search) => set({ postSearch: search }),

  toggleLike: async (postId) => {
    if (!get().isAuthenticated) throw new Error('AUTH_REQUIRED');
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;
    const wasLiked = post.isLiked;
    const update = (p: Post): Post =>
      p.id === postId
        ? { ...p, isLiked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 }
        : p;
    set((s) => ({
      posts: s.posts.map(update),
      selectedPost: s.selectedPost?.id === postId ? update(s.selectedPost) : s.selectedPost,
    }));
    try {
      if (wasLiked) await postsApi.unlikePost(postId);
      else await postsApi.likePost(postId);
    } catch {
      const revert = (p: Post): Post =>
        p.id === postId
          ? { ...p, isLiked: wasLiked, likes: wasLiked ? p.likes + 1 : p.likes - 1 }
          : p;
      set((s) => ({
        posts: s.posts.map(revert),
        selectedPost: s.selectedPost?.id === postId ? revert(s.selectedPost) : s.selectedPost,
      }));
    }
  },

  addComment: async (postId, content) => {
    if (!get().isAuthenticated) throw new Error('AUTH_REQUIRED');
    const { comment } = await postsApi.addComment(postId, content);
    const newComment = mapComment(comment, postId);
    set((s) => ({
      postComments: {
        ...s.postComments,
        [postId]: [...(s.postComments[postId] ?? []), newComment],
      },
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ),
      selectedPost:
        s.selectedPost?.id === postId
          ? { ...s.selectedPost, commentCount: s.selectedPost.commentCount + 1 }
          : s.selectedPost,
    }));
  },

  getFilteredPosts: () => {
    const { posts, postFilter, postSort, postSearch } = get();
    let result = posts;
    if (postFilter !== 'all') result = result.filter((p) => p.category === postFilter);
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      result = result.filter(
        (p) => p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    return postSort === 'popular'
      ? [...result].sort((a, b) => b.likes - a.likes)
      : [...result].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  // ── Articles ───────────────────────────────────────────────────────────────
  articles: [],
  articlesLoading: false,
  selectedArticle: null,
  articleFilter: 'all',
  articleSearch: '',
  pendingArticles: [],
  pendingArticlesLoading: false,
  myExpertApplication: null,
  expertApplications: [],
  experts: [],
  expertsLoading: false,

  fetchArticles: async () => {
    set({ articlesLoading: true });
    try {
      const { articleFilter, articleSearch } = get();
      const { articles } = await articlesApi.getArticles({
        category: articleFilter === 'all' ? undefined : articleFilter,
        search: articleSearch || undefined,
      });
      set({ articles: articles.map(mapArticle) });
    } catch (err) {
      console.error('fetchArticles error', err);
    } finally {
      set({ articlesLoading: false });
    }
  },

  fetchMyArticles: async () => {
    set({ articlesLoading: true });
    try {
      const { articles } = await articlesApi.getArticles({ mine: true });
      set({ articles: articles.map(mapArticle) });
    } catch (err) {
      console.error('fetchMyArticles error', err);
    } finally {
      set({ articlesLoading: false });
    }
  },

  fetchPendingArticles: async () => {
    set({ pendingArticlesLoading: true });
    try {
      const { articles } = await articlesApi.getPendingArticles();
      set({ pendingArticles: articles.map(mapArticle) });
    } catch (err) {
      console.error('fetchPendingArticles error', err);
    } finally {
      set({ pendingArticlesLoading: false });
    }
  },

  fetchExpertApplications: async () => {
    try {
      const { applications } = await expertApplicationsApi.getAll();
      set({ expertApplications: applications.map(mapExpertApplication) });
    } catch (err) {
      console.error('fetchExpertApplications error', err);
    }
  },

  fetchMyApplication: async () => {
    try {
      const { application } = await expertApplicationsApi.getMyApplication();
      set({ myExpertApplication: application ? mapExpertApplication(application) : null });
    } catch (err) {
      console.error('fetchMyApplication error', err);
    }
  },

  fetchExperts: async () => {
    set({ expertsLoading: true });
    try {
      const { experts } = await expertApplicationsApi.getExperts();
      set({ experts: experts.map(mapExpert) });
    } catch (err) {
      console.error('fetchExperts error', err);
    } finally {
      set({ expertsLoading: false });
    }
  },

  setArticleFilter: (filter) => set({ articleFilter: filter }),
  setArticleSearch: (search) => set({ articleSearch: search }),
  selectArticle: (article) => set({ selectedArticle: article }),

  toggleBookmark: async (articleId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const isBookmarked = currentUser.bookmarks.includes(articleId);
    set((s) => ({
      currentUser: s.currentUser
        ? {
            ...s.currentUser,
            bookmarks: isBookmarked
              ? s.currentUser.bookmarks.filter((id) => id !== articleId)
              : [...s.currentUser.bookmarks, articleId],
          }
        : null,
    }));
    try {
      if (isBookmarked) await articlesApi.unbookmark(articleId);
      else await articlesApi.bookmark(articleId);
    } catch {
      set((s) => ({
        currentUser: s.currentUser
          ? {
              ...s.currentUser,
              bookmarks: isBookmarked
                ? [...s.currentUser.bookmarks, articleId]
                : s.currentUser.bookmarks.filter((id) => id !== articleId),
            }
          : null,
      }));
    }
  },

  getFilteredArticles: () => {
    const { articles, articleFilter, articleSearch } = get();
    let result = articles;
    if (articleFilter !== 'all') result = result.filter((a) => a.category === articleFilter);
    if (articleSearch.trim()) {
      const q = articleSearch.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  },

  createArticle: async (data) => {
    const { article } = await articlesApi.createArticle(data);
    set((s) => ({ articles: [mapArticle(article), ...s.articles] }));
  },
  updateArticle: async (id, data) => {
    const { article } = await articlesApi.updateArticle(id, data);
    const mapped = mapArticle(article);
    set((s) => ({
      articles: s.articles.map((a) => (a.id === id ? mapped : a)),
      pendingArticles: s.pendingArticles.map((a) => (a.id === id ? mapped : a)),
    }));
  },
  publishArticle: async (id) => {
    const { article } = await articlesApi.publishArticle(id);
    const mapped = mapArticle(article);
    set((s) => ({
      pendingArticles: s.pendingArticles.filter((a) => a.id !== id),
      articles: s.articles.some((a) => a.id === id)
        ? s.articles.map((a) => (a.id === id ? mapped : a))
        : [mapped, ...s.articles],
    }));
  },
  rejectArticle: async (id) => {
    await articlesApi.rejectArticle(id);
    set((s) => ({
      pendingArticles: s.pendingArticles.filter((a) => a.id !== id),
    }));
  },
  deleteArticle: async (id) => {
    await articlesApi.deleteArticle(id);
    set((s) => ({
      articles: s.articles.filter((a) => a.id !== id),
      pendingArticles: s.pendingArticles.filter((a) => a.id !== id),
    }));
  },

  applyAsExpert: async (data) => {
    const { application } = await expertApplicationsApi.apply(data);
    set({ myExpertApplication: mapExpertApplication(application) });
  },
  approveExpertApplication: async (id) => {
    await expertApplicationsApi.approve(id);
    set((s) => ({
      expertApplications: s.expertApplications.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
    }));
  },
  rejectExpertApplication: async (id, reviewNote) => {
    await expertApplicationsApi.reject(id, reviewNote);
    set((s) => ({
      expertApplications: s.expertApplications.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const, reviewNote: reviewNote ?? null } : a
      ),
    }));
  },

  // ── Expert Q&A ─────────────────────────────────────────────────────────────
  questions: [],
  questionsLoading: false,
  answers: {},
  selectedQuestion: null,
  expertFilter: 'all',
  expertSearch: '',

  fetchQuestions: async () => {
    set({ questionsLoading: true });
    try {
      const { expertFilter, expertSearch } = get();
      const { questions } = await questionsApi.getQuestions({
        topic: expertFilter === 'all' ? undefined : expertFilter,
        search: expertSearch || undefined,
      });
      set({ questions: questions.map(mapQuestion) });
    } catch (err) {
      console.error('fetchQuestions error', err);
    } finally {
      set({ questionsLoading: false });
    }
  },

  addQuestion: async (data) => {
    const { question } = await questionsApi.createQuestion(data);
    set((s) => ({ questions: [mapQuestion(question), ...s.questions] }));
  },

  selectQuestion: async (q) => {
    set({ selectedQuestion: q });
    if (!q) return;
    if (!get().answers[q.id]) {
      try {
        const { question: full } = await questionsApi.getQuestion(q.id);
        const answers = (full.answers ?? []).map((a) => mapAnswer(a, q.id));
        set((s) => ({ answers: { ...s.answers, [q.id]: answers } }));
      } catch {}
    }
  },

  setExpertFilter: (filter) => set({ expertFilter: filter }),
  setExpertSearch: (search) => set({ expertSearch: search }),

  getFilteredQuestions: () => {
    const { questions, expertFilter, expertSearch } = get();
    let result = questions;
    if (expertFilter !== 'all') result = result.filter((q) => q.topic === expertFilter);
    if (expertSearch.trim()) {
      const s = expertSearch.toLowerCase();
      result = result.filter((q) => q.question.toLowerCase().includes(s));
    }
    return result;
  },

  // ── Chat ───────────────────────────────────────────────────────────────────
  chatOpen: false,
  chatMessages: [welcomeMessage],
  chatLoading: false,

  setChatOpen: (open) => set({ chatOpen: open }),

  sendChatMessage: async (content) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      isAi: false,
      timestamp: new Date(),
    };
    set((s) => ({ chatMessages: [...s.chatMessages, userMsg], chatLoading: true }));
    try {
      const { message } = await chatApi.sendMessage(content);
      set((s) => ({
        chatMessages: [...s.chatMessages, mapChatMessage(message)],
      }));
    } catch {
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        content: "I'm sorry, I couldn't reach the server right now. Please try again in a moment.",
        isAi: true,
        timestamp: new Date(),
      };
      set((s) => ({ chatMessages: [...s.chatMessages, errMsg] }));
    } finally {
      set({ chatLoading: false });
    }
  },

  sendFeedback: async (messageId, isHelpful) => {
    try {
      await chatApi.submitFeedback(messageId, isHelpful);
    } catch {
      // silent
    }
  },
}));
