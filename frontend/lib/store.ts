import { create } from 'zustand';

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
  readTime: number;
  timestamp: Date;
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
}

// ─── Store Interface ───────────────────────────────────────────────────────────

interface AppStore {
  // Navigation
  currentView: View;
  setView: (view: View) => void;

  // Current user (mock auth)
  currentUser: User;
  updateProfile: (updates: Partial<User>) => void;

  // Posts
  posts: Post[];
  selectedPost: Post | null;
  postComments: Record<string, Comment[]>;
  postFilter: PostCategory | 'all';
  postSort: 'newest' | 'popular';
  postSearch: string;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'commentCount' | 'isLiked'>) => void;
  selectPost: (post: Post | null) => void;
  setPostFilter: (filter: PostCategory | 'all') => void;
  setPostSort: (sort: 'newest' | 'popular') => void;
  setPostSearch: (search: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  getFilteredPosts: () => Post[];

  // Articles
  articles: Article[];
  selectedArticle: Article | null;
  articleFilter: ArticleCategory | 'all';
  articleSearch: string;
  setArticles: (articles: Article[]) => void;
  setArticleFilter: (filter: ArticleCategory | 'all') => void;
  setArticleSearch: (search: string) => void;
  selectArticle: (article: Article | null) => void;
  toggleBookmark: (articleId: string) => void;
  getFilteredArticles: () => Article[];

  // Expert Q&A
  questions: Question[];
  answers: Record<string, Answer[]>;
  selectedQuestion: Question | null;
  expertFilter: ExpertTopic | 'all';
  expertSearch: string;
  addQuestion: (q: Omit<Question, 'id' | 'timestamp' | 'answerCount'>) => void;
  selectQuestion: (q: Question | null) => void;
  setExpertFilter: (filter: ExpertTopic | 'all') => void;
  setExpertSearch: (search: string) => void;
  getFilteredQuestions: () => Question[];

  // Chat
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  setChatOpen: (open: boolean) => void;
  sendChatMessage: (content: string) => void;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'u1',
  name: 'Sarah Chen',
  avatar: '/placeholder-user.jpg',
  bio: 'First-time mom to a 6-month-old. Love connecting with other moms!',
  isExpert: false,
  bookmarks: [],
};

const mockPosts: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    author: 'Emma Wilson',
    avatar: '/placeholder-user.jpg',
    category: 'pregnancy',
    content: "Just hit 28 weeks and my back pain is getting intense. Anyone have tips that actually helped? My OB suggested prenatal yoga but I'm not sure where to start. Would love some recommendations from moms who've been through this!",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    likes: 24,
    commentCount: 8,
    isAnonymous: false,
    isLiked: false,
  },
  {
    id: 'p2',
    authorId: 'u3',
    author: 'Anonymous',
    avatar: '/placeholder-user.jpg',
    category: 'parenting',
    content: "My 2-year-old has been having massive tantrums in public and I honestly feel so embarrassed and overwhelmed. Is this normal? How do other parents handle it without completely losing their minds?",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    likes: 56,
    commentCount: 21,
    isAnonymous: true,
    isLiked: true,
  },
  {
    id: 'p3',
    authorId: 'u4',
    author: 'Priya Sharma',
    avatar: '/placeholder-user.jpg',
    category: 'health',
    content: 'Postpartum anxiety is real and I wish someone had warned me. At 4 months postpartum I finally sought help and it made a world of difference. Sharing my experience in case anyone else is struggling silently.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    likes: 142,
    commentCount: 34,
    isAnonymous: false,
    isLiked: false,
  },
  {
    id: 'p4',
    authorId: 'u5',
    author: 'Lucia Martinez',
    avatar: '/placeholder-user.jpg',
    category: 'general',
    content: 'Just wanted to share a win: my baby slept through the night for the first time last night! 7 months of sleep deprivation and it finally happened. There is light at the end of the tunnel, mamas!',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    likes: 89,
    commentCount: 15,
    isAnonymous: false,
    isLiked: true,
  },
  {
    id: 'p5',
    authorId: 'u6',
    author: 'Jade Thompson',
    avatar: '/placeholder-user.jpg',
    category: 'pregnancy',
    content: 'First trimester fatigue is absolutely brutal. I could sleep 12 hours and still feel exhausted. How did you all manage to function at work while feeling this way? Any tips would be so appreciated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    likes: 37,
    commentCount: 12,
    isAnonymous: false,
    isLiked: false,
  },
  {
    id: 'p6',
    authorId: 'u7',
    author: 'Anonymous',
    avatar: '/placeholder-user.jpg',
    category: 'health',
    content: 'Has anyone dealt with breastfeeding difficulties and guilt? I switched to formula at 6 weeks and still feel terrible about it even though my baby is thriving. Fed is best, but the guilt is so heavy.',
    timestamp: new Date(Date.now() - 1000 * 60 * 420),
    likes: 201,
    commentCount: 48,
    isAnonymous: true,
    isLiked: false,
  },
];

const mockComments: Record<string, Comment[]> = {
  p1: [
    { id: 'c1', postId: 'p1', authorId: 'u8', author: 'Maya Johnson', avatar: '/placeholder-user.jpg', content: 'Prenatal yoga with Adriene on YouTube is amazing and free! Her pregnancy series really helped my back.', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { id: 'c2', postId: 'p1', authorId: 'u9', author: 'Aisha Patel', avatar: '/placeholder-user.jpg', content: 'A pregnancy pillow was a lifesaver for me! The U-shaped ones are especially good for back support while sleeping.', timestamp: new Date(Date.now() - 1000 * 60 * 8) },
    { id: 'c3', postId: 'p1', authorId: 'u10', author: 'Rachel Kim', avatar: '/placeholder-user.jpg', content: 'Swimming helped me so much! The buoyancy takes pressure off everything. Check if your local pool has prenatal aqua classes.', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  p2: [
    { id: 'c4', postId: 'p2', authorId: 'u11', author: 'Nina Clarke', avatar: '/placeholder-user.jpg', content: 'Completely normal! 2 is peak tantrum age. Try to stay calm and get down to their level. It does get better.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 'c5', postId: 'p2', authorId: 'u12', author: 'Sofia Rossi', avatar: '/placeholder-user.jpg', content: "The \"big feelings\" approach helped us - acknowledge the emotion first before redirecting. Janet Lansbury's podcast is great for this.", timestamp: new Date(Date.now() - 1000 * 60 * 20) },
  ],
  p3: [],
  p4: [],
  p5: [],
  p6: [],
};

const mockArticles: Article[] = [
  {
    id: 'a1',
    title: 'Understanding Postpartum Depression: Signs, Causes & When to Seek Help',
    excerpt: 'Postpartum depression affects up to 1 in 5 new mothers. Learn to recognize the signs and understand that help is available.',
    content: 'Full article content would be here...',
    category: 'health',
    tags: ['mental health', 'postpartum', 'depression'],
    author: 'Dr. Amara Osei',
    readTime: 7,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: 'a2',
    title: 'Nutrition During Pregnancy: A Trimester-by-Trimester Guide',
    excerpt: 'What to eat, what to avoid, and how to ensure you and your baby are getting all the nutrients you need throughout pregnancy.',
    content: 'Full article content would be here...',
    category: 'nutrition',
    tags: ['nutrition', 'pregnancy', 'diet'],
    author: 'Dr. Lisa Park',
    readTime: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: 'a3',
    title: 'The Science of Sleep Training: Methods, Myths & What Actually Works',
    excerpt: 'A balanced look at the most popular sleep training approaches and the evidence behind them.',
    content: 'Full article content would be here...',
    category: 'parenting',
    tags: ['sleep', 'newborn', 'sleep training'],
    author: 'Dr. James Okonkwo',
    readTime: 9,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'a4',
    title: 'Breastfeeding Challenges: Latching Issues, Supply Concerns & Support',
    excerpt: 'Honest guidance on the most common breastfeeding difficulties and practical strategies to overcome them.',
    content: 'Full article content would be here...',
    category: 'health',
    tags: ['breastfeeding', 'newborn', 'lactation'],
    author: 'Maria Santos, IBCLC',
    readTime: 10,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: 'a5',
    title: 'Preparing Your Toddler for a New Sibling',
    excerpt: 'Practical strategies to help your toddler transition to becoming a big sibling with confidence and excitement.',
    content: 'Full article content would be here...',
    category: 'parenting',
    tags: ['toddler', 'siblings', 'pregnancy'],
    author: 'Dr. Rebecca Walsh',
    readTime: 6,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    id: 'a6',
    title: 'Your Third Trimester: What to Expect Week by Week',
    excerpt: 'A comprehensive guide to the final stretch of pregnancy, from physical changes to preparing for birth.',
    content: 'Full article content would be here...',
    category: 'pregnancy',
    tags: ['third trimester', 'birth', 'pregnancy'],
    author: 'Dr. Amara Osei',
    readTime: 15,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
  },
];

const mockQuestions: Question[] = [
  {
    id: 'q1',
    authorId: 'u13',
    author: 'Anonymous',
    avatar: '/placeholder-user.jpg',
    question: 'At what point during pregnancy should I start taking iron supplements? My doctor mentioned my levels are borderline.',
    topic: 'medical',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    answerCount: 1,
    isAnonymous: true,
  },
  {
    id: 'q2',
    authorId: 'u14',
    author: 'Tanya Brooks',
    avatar: '/placeholder-user.jpg',
    question: 'I\'m 6 weeks postpartum and feeling really disconnected from my baby. I love her but I don\'t feel that "rush" I expected. Is this normal and does it get better?',
    topic: 'mental_health',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    answerCount: 2,
    isAnonymous: false,
  },
  {
    id: 'q3',
    authorId: 'u15',
    author: 'Kate Miller',
    avatar: '/placeholder-user.jpg',
    question: 'My 18-month-old is a very picky eater and I\'m worried she\'s not getting enough nutrients. What are the best high-nutrition foods for toddlers who refuse vegetables?',
    topic: 'nutrition',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    answerCount: 1,
    isAnonymous: false,
  },
  {
    id: 'q4',
    authorId: 'u16',
    author: 'Dana Wright',
    avatar: '/placeholder-user.jpg',
    question: 'My 3-year-old has started hitting when frustrated. We\'ve tried time-outs with mixed results. What are evidence-based approaches for managing aggression in toddlers?',
    topic: 'parenting',
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    answerCount: 3,
    isAnonymous: false,
  },
];

const mockAnswers: Record<string, Answer[]> = {
  q1: [
    { id: 'an1', questionId: 'q1', expertId: 'e1', expert: 'Dr. Amara Osei', expertAvatar: '/placeholder-user.jpg', content: 'Iron supplementation typically starts when hemoglobin drops below 10.5 g/dL or ferritin below 30 µg/L. "Borderline" usually means you\'re close to those thresholds. I\'d recommend starting a gentle iron supplement now (like ferrous bisglycinate which is easier on digestion) alongside vitamin C to enhance absorption. Follow up with your OB in 4-6 weeks to retest levels.', timestamp: new Date(Date.now() - 1000 * 60 * 20) },
  ],
  q2: [
    { id: 'an2', questionId: 'q2', expertId: 'e2', expert: 'Dr. Rachel Coleman, Psychologist', expertAvatar: '/placeholder-user.jpg', content: 'What you\'re describing — feeling love but not the "rush" — is incredibly common and often not discussed enough. The Hollywood version of instant overwhelming love is a myth for many parents. Bonding is a process, not a moment, and it often grows gradually through daily caregiving routines.', timestamp: new Date(Date.now() - 1000 * 60 * 70) },
    { id: 'an3', questionId: 'q2', expertId: 'e3', expert: 'Maria Santos, IBCLC', expertAvatar: '/placeholder-user.jpg', content: 'It\'s also worth noting that disconnection at 6 weeks can sometimes be an early sign of postpartum depression or anxiety, even if it doesn\'t feel like "depression." I\'d recommend mentioning this at your next appointment so it can be monitored. You\'re not alone, and this gets better.', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  ],
  q3: [
    { id: 'an4', questionId: 'q3', expertId: 'e4', expert: 'Dr. Lisa Park, Pediatric Nutritionist', expertAvatar: '/placeholder-user.jpg', content: 'Toddler picky eating is developmentally normal, though I understand the worry. Nutrient-dense "trojan horse" foods that hide vegetables work well: smoothies with spinach, pasta sauces with blended veggies, or zucchini muffins. Also ensure adequate fat intake (avocado, nut butters) and iron sources like beans or fortified cereals. Repeated exposure — 10-15 times — is key before a child accepts a new food, so keep offering without pressure.', timestamp: new Date(Date.now() - 1000 * 60 * 150) },
  ],
  q4: [
    { id: 'an5', questionId: 'q4', expertId: 'e2', expert: 'Dr. Rachel Coleman, Psychologist', expertAvatar: '/placeholder-user.jpg', content: 'Hitting at 3 is very common — language is still developing and the body reacts faster than words can form. The most evidence-based approach is connection before correction: get calm, get close, name the feeling ("you\'re really frustrated"), then redirect ("we don\'t hit, you can squeeze this pillow"). Time-outs work better as brief "cool down" breaks rather than punishments.', timestamp: new Date(Date.now() - 1000 * 60 * 300) },
    { id: 'an6', questionId: 'q4', expertId: 'e5', expert: 'James Okonkwo, Child Development Specialist', expertAvatar: '/placeholder-user.jpg', content: 'Also look at what\'s triggering the hitting — tiredness, hunger, and overstimulation are the top culprits. Preventive strategies work better than reactive ones. Consistent routines, adequate sleep, and teaching emotional vocabulary during calm moments builds the skills needed to self-regulate.', timestamp: new Date(Date.now() - 1000 * 60 * 280) },
    { id: 'an7', questionId: 'q4', expertId: 'e4', expert: 'Dr. Lisa Park, Pediatric Nutritionist', expertAvatar: '/placeholder-user.jpg', content: 'One nutritional note — low blood sugar (hunger) is a real trigger for emotional dysregulation in toddlers. Ensure regular snacks with protein and fat to stabilize blood sugar throughout the day. The "hangry" phenomenon is very real in young children.', timestamp: new Date(Date.now() - 1000 * 60 * 260) },
  ],
};

const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg0',
    content: 'Hello! I\'m your AI support assistant. I\'m here to help with questions about pregnancy, parenting, and maternal health. Please remember I provide general information only — always consult your healthcare provider for medical advice. How can I help you today?',
    isAi: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
];

const aiResponses = [
  "That's a great question. Based on general guidance, it's always best to discuss this with your healthcare provider for personalized advice. Many mothers find that establishing a routine and seeking community support makes a significant difference.",
  "You're not alone in feeling this way. This is a very common experience for new and expecting mothers. I'd recommend exploring our educational library for detailed articles on this topic, and consider posting in the community feed to hear from others who've been through it.",
  "From a general health perspective, self-care is crucial during this time. Rest when you can, stay hydrated, and don't hesitate to ask for help. Our Expert Q&A section has verified healthcare professionals who can provide more specific guidance.",
  "This is something many mothers navigate. The most important thing is to trust your instincts while also staying connected to your care team. Would you like me to point you to some relevant articles in our library?",
  "Thank you for sharing that with me. Your feelings are completely valid. Remember, seeking support — whether through this community, a professional, or loved ones — is a sign of strength, not weakness. Is there anything specific I can help you explore further?",
];

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // Navigation
  currentView: 'home',
  setView: (view) => set({ currentView: view }),

  // User
  currentUser: mockUser,
  updateProfile: (updates) =>
    set((s) => ({ currentUser: { ...s.currentUser, ...updates } })),

  // ── Posts ──────────────────────────────────────────────────────────────────
  posts: mockPosts,
  selectedPost: null,
  postComments: mockComments,
  postFilter: 'all',
  postSort: 'newest',
  postSearch: '',

  setPosts: (posts) => set({ posts }),

  addPost: (post) => {
    const newPost: Post = {
      ...post,
      id: `p${Date.now()}`,
      timestamp: new Date(),
      likes: 0,
      commentCount: 0,
      isLiked: false,
    };
    set((s) => ({ posts: [newPost, ...s.posts], postComments: { ...s.postComments, [newPost.id]: [] } }));
  },

  selectPost: (post) => set({ selectedPost: post }),

  setPostFilter: (filter) => set({ postFilter: filter }),
  setPostSort: (sort) => set({ postSort: sort }),
  setPostSearch: (search) => set({ postSearch: search }),

  toggleLike: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ),
      selectedPost:
        s.selectedPost?.id === postId
          ? { ...s.selectedPost, isLiked: !s.selectedPost.isLiked, likes: s.selectedPost.isLiked ? s.selectedPost.likes - 1 : s.selectedPost.likes + 1 }
          : s.selectedPost,
    })),

  addComment: (postId, content) => {
    const { currentUser } = get();
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      authorId: currentUser.id,
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      timestamp: new Date(),
    };
    set((s) => ({
      postComments: {
        ...s.postComments,
        [postId]: [...(s.postComments[postId] || []), newComment],
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
      result = result.filter((p) => p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    }
    return postSort === 'popular'
      ? [...result].sort((a, b) => b.likes - a.likes)
      : [...result].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  // ── Articles ───────────────────────────────────────────────────────────────
  articles: mockArticles,
  selectedArticle: null,
  articleFilter: 'all',
  articleSearch: '',
  setArticles: (articles) => set({ articles }),

  setArticleFilter: (filter) => set({ articleFilter: filter }),
  setArticleSearch: (search) => set({ articleSearch: search }),
  selectArticle: (article) => set({ selectedArticle: article }),

  toggleBookmark: (articleId) =>
    set((s) => {
      const bookmarks = s.currentUser.bookmarks.includes(articleId)
        ? s.currentUser.bookmarks.filter((id) => id !== articleId)
        : [...s.currentUser.bookmarks, articleId];
      return { currentUser: { ...s.currentUser, bookmarks } };
    }),

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

  // ── Expert Q&A ─────────────────────────────────────────────────────────────
  questions: mockQuestions,
  answers: mockAnswers,
  selectedQuestion: null,
  expertFilter: 'all',
  expertSearch: '',

  addQuestion: (q) => {
    const newQ: Question = {
      ...q,
      id: `q${Date.now()}`,
      timestamp: new Date(),
      answerCount: 0,
    };
    set((s) => ({
      questions: [newQ, ...s.questions],
      answers: { ...s.answers, [newQ.id]: [] },
    }));
  },

  selectQuestion: (q) => set({ selectedQuestion: q }),
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
  chatMessages: mockChatMessages,
  chatLoading: false,

  setChatOpen: (open) => set({ chatOpen: open }),

  sendChatMessage: (content) => {
    const userMsg: ChatMessage = {
      id: `msg${Date.now()}`,
      content,
      isAi: false,
      timestamp: new Date(),
    };
    set((s) => ({ chatMessages: [...s.chatMessages, userMsg], chatLoading: true }));

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg${Date.now() + 1}`,
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isAi: true,
        timestamp: new Date(),
      };
      set((s) => ({ chatMessages: [...s.chatMessages, aiMsg], chatLoading: false }));
    }, 1200 + Math.random() * 800);
  },
}));
