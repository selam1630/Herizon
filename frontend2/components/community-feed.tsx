'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore, type PostCategory } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpDown,
  Baby,
  ChevronLeft,
  Heart,
  Leaf,
  Lock,
  MessageCircle,
  Milk,
  Plus,
  Search,
  Send,
  Smile,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { value: PostCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'health', label: 'Health' },
  { value: 'general', label: 'General' },
];

const CATEGORY_COLORS: Record<PostCategory, string> = {
  pregnancy: 'bg-pink-100 text-pink-700 border-pink-200',
  parenting: 'bg-purple-100 text-purple-700 border-purple-200',
  health: 'bg-teal-100 text-teal-700 border-teal-200',
  general: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ─── Login Prompt Dialog ──────────────────────────────────────────────────────

function LoginPromptDialog({
  open,
  onOpenChange,
  onGoToAuth,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGoToAuth: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Join to participate</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create a free account to like posts, leave comments, and share your own story with the community.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full" onClick={onGoToAuth}>
              Sign up — it&apos;s free
            </Button>
            <Button variant="outline" className="w-full" onClick={onGoToAuth}>
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onClick,
  isAuthenticated,
  onAuthRequired,
}: {
  post: ReturnType<typeof useAppStore.getState>['posts'][0];
  onClick: () => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}) {
  const { toggleLike } = useAppStore();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { onAuthRequired(); return; }
    toggleLike(post.id).catch(() => {});
  };

  return (
    <article
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      aria-label={`View post by ${post.isAnonymous ? 'Anonymous' : post.author}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {!post.isAnonymous && <AvatarImage src={post.avatar} alt={post.author} />}
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {post.isAnonymous ? <User className="h-4 w-4" /> : post.author.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground leading-none">
              {post.isAnonymous ? 'Anonymous' : post.author}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDistanceToNow(post.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 text-xs ${CATEGORY_COLORS[post.category]}`}>
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/90">
        {post.content}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
          aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
        >
          <Heart className="h-4 w-4" fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>{post.likes}</span>
        </button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentCount}</span>
        </div>
      </div>
    </article>
  );
}

// ─── Post Detail ──────────────────────────────────────────────────────────────

function PostDetail({
  postId,
  onBack,
  isAuthenticated,
  onAuthRequired,
}: {
  postId: string;
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}) {
  const { posts, postComments, addComment, toggleLike, selectPost, currentUser } = useAppStore();
  const post = posts.find((p) => p.id === postId);
  const comments = postComments[postId] || [];
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load comments when post detail is opened
  useEffect(() => {
    if (post) selectPost(post);
    return () => { selectPost(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!post) return null;

  const handleLike = () => {
    if (!isAuthenticated) { onAuthRequired(); return; }
    toggleLike(post.id).catch(() => {});
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) { onAuthRequired(); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(post.id, commentText.trim());
      setCommentText('');
    } catch {
      // error already handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to feed
      </button>

      {/* Post */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {!post.isAnonymous && <AvatarImage src={post.avatar} alt={post.author} />}
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {post.isAnonymous ? <User className="h-4 w-4" /> : post.author.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {post.isAnonymous ? 'Anonymous' : post.author}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${CATEGORY_COLORS[post.category]}`}>
            {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
          </Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{post.content}</p>
        <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              post.isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Heart className="h-4 w-4" fill={post.isLiked ? 'currentColor' : 'none'} />
            <span>{post.likes} likes</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length} comments</span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-foreground">
          Comments ({comments.length})
        </h3>
        <div className="flex flex-col gap-3">
          {comments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to respond.
            </p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.avatar} alt={comment.author} />
                <AvatarFallback className="bg-muted text-xs">
                  {comment.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{comment.author}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment */}
        {isAuthenticated ? (
          <div className="mt-4 flex gap-3 rounded-lg border border-border bg-card p-4">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.name ?? ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {(currentUser?.name ?? '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col gap-2">
              <Textarea
                placeholder="Add a supportive comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[72px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment();
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onAuthRequired}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Lock className="h-4 w-4" />
            Sign in to leave a comment
          </button>
        )}
      </div>
    </div>
  );
}

// ─── New Post Dialog ──────────────────────────────────────────────────────────

function NewPostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addPost, currentUser } = useAppStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addPost({
        content: content.trim(),
        category,
        isAnonymous,
      });
      setContent('');
      setCategory('general');
      setIsAnonymous(false);
      onOpenChange(false);
    } catch {
      // handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <Textarea
            placeholder="Share what's on your mind, ask for advice, or offer support..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none text-sm"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right -mt-2">{content.length}/2000</p>

          <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="category-select" className="text-sm font-medium">
                Category
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
                <SelectTrigger id="category-select" className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="anon-switch" className="text-sm font-medium">
                Post anonymously
              </Label>
              <Switch id="anon-switch" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
              {submitting ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export function CommunityFeed() {
  const {
    postFilter, postSort, postSearch,
    setPostFilter, setPostSort, setPostSearch,
    getFilteredPosts, fetchPosts, postsLoading,
    isAuthenticated, setView,
  } = useAppStore();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);


  // Fetch posts on mount and whenever filter/search changes
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postFilter, postSearch]);

  const handleAuthRequired = () => setLoginPromptOpen(true);
  const handleGoToAuth = () => { setLoginPromptOpen(false); setView('home'); };

  const filteredPosts = getFilteredPosts();

  // Auto-select first post when posts load and none is selected (desktop only)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      if (!selectedPostId && filteredPosts.length > 0) {
        setSelectedPostId(filteredPosts[0].id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPosts.length, selectedPostId]);

  // Responsive two-column layout
  return (
    <div className="relative min-h-[80vh] w-full bg-gradient-to-br from-[#fdf6f4] via-[#f9ede9] to-[#f5e6e2] px-0 py-0 overflow-hidden">
      {/* Decorative background icons */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        {/* Top-left cluster */}
        <Heart style={{ position: 'absolute', left: -20, top: -20, width: 110, height: 110, opacity: 0.18, color: '#CB978E' }} />
        <Baby style={{ position: 'absolute', left: 60, top: 140, width: 80, height: 80, opacity: 0.15, color: '#CB978E' }} />
        <Milk style={{ position: 'absolute', left: 10, top: 300, width: 70, height: 70, opacity: 0.14, color: '#CAA69B' }} />
        {/* Top-right cluster */}
        <Stethoscope style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, opacity: 0.18, color: '#CB978E' }} />
        <Leaf style={{ position: 'absolute', right: 70, top: 160, width: 72, height: 72, opacity: 0.15, color: '#D4B9B2' }} />
        <Heart style={{ position: 'absolute', right: 20, top: 300, width: 64, height: 64, opacity: 0.13, color: '#CB978E' }} />
        {/* Bottom-left cluster */}
        <Smile style={{ position: 'absolute', left: 30, bottom: 80, width: 80, height: 80, opacity: 0.16, color: '#CB978E' }} />
        <Baby style={{ position: 'absolute', left: 140, bottom: -20, width: 90, height: 90, opacity: 0.14, color: '#CAA69B' }} />
        {/* Bottom-right cluster */}
        <Users style={{ position: 'absolute', right: -20, bottom: 60, width: 100, height: 100, opacity: 0.16, color: '#D4B9B2' }} />
        <Stethoscope style={{ position: 'absolute', right: 120, bottom: -30, width: 80, height: 80, opacity: 0.14, color: '#CB978E' }} />
        {/* Mid edges */}
        <Milk style={{ position: 'absolute', right: -10, top: '45%', width: 70, height: 70, opacity: 0.13, color: '#CAA69B' }} />
        <Leaf style={{ position: 'absolute', left: -10, top: '42%', width: 68, height: 68, opacity: 0.13, color: '#D4B9B2' }} />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-0 px-0 py-0 lg:flex-row lg:gap-0">
        {/* Feed column */}
        <div className="w-full lg:w-[60%] xl:w-[62%] px-4 py-10 sm:px-8 lg:pl-12 lg:pr-8">
          {/* Header */}
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#3d2b27]">Community</h1>
              <p className="mt-1 text-base text-[#7a6360]">A safe space to share, ask, and support.</p>
            </div>
            <Button
              onClick={() => {
                if (!isAuthenticated) { handleAuthRequired(); return; }
                setNewPostOpen(true);
              }}
              className="hidden rounded-full bg-gradient-to-tr from-[#CAA69B] to-[#CB978E] px-6 py-2.5 text-white shadow-lg transition-all hover:brightness-105 lg:flex"
              style={{ fontWeight: 700 }}
            >
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="pl-9 text-sm h-10 rounded-full bg-white/80 shadow-sm border border-[#ecddd9]"
              />
              {postSearch && (
                <button
                  onClick={() => setPostSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={postSort} onValueChange={(v) => setPostSort(v as 'newest' | 'popular')}>
              <SelectTrigger className="w-full sm:w-36 h-10 rounded-full text-sm gap-1.5 border border-[#ecddd9] bg-white/80 shadow-sm">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category pills */}
          <div className="mb-7 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setPostFilter(cat.value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                  postFilter === cat.value
                    ? 'border-[#CB978E] bg-[#CB978E] text-white'
                    : 'border-[#ecddd9] bg-white/80 text-[#7a6360] hover:border-[#CB978E] hover:text-[#CB978E]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Guest banner */}
          {!isAuthenticated && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">You&apos;re browsing as a guest.</span>{' '}
                Sign in to like, comment, and post.
              </p>
              <Button size="sm" variant="outline" onClick={handleAuthRequired} className="shrink-0">
                Sign in
              </Button>
            </div>
          )}

          {/* Posts feed */}
          <div className="flex flex-col gap-5">
            {postsLoading ? (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">Loading posts…</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-foreground">No posts found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {postSearch ? 'Try a different search term.' : 'Be the first to start the conversation.'}
                </p>
                {isAuthenticated && (
                  <Button onClick={() => setNewPostOpen(true)} className="mt-4 gap-1.5" variant="outline">
                    <Plus className="h-4 w-4" />
                    Create Post
                  </Button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => setSelectedPostId(post.id)}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={handleAuthRequired}
                />
              ))
            )}
          </div>

          {/* Floating New Post button (mobile) */}
          <Button
            onClick={() => {
              if (!isAuthenticated) { handleAuthRequired(); return; }
              setNewPostOpen(true);
            }}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#CAA69B] to-[#CB978E] text-white shadow-xl transition-all hover:brightness-105 lg:hidden"
            style={{ fontWeight: 700 }}
            aria-label="New Post"
          >
            <Plus className="h-6 w-6" />
          </Button>

          {isAuthenticated && <NewPostDialog open={newPostOpen} onOpenChange={setNewPostOpen} />}
          <LoginPromptDialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen} onGoToAuth={handleGoToAuth} />
        </div>

        {/* Comments/details panel (slide-in) */}
        <div
          className={`fixed inset-0 z-50 flex w-full max-w-full transition-transform duration-300 lg:static lg:inset-auto lg:z-auto lg:w-[40%] xl:w-[38%] lg:max-w-[520px] bg-white/95 shadow-2xl border-l border-[#ecddd9] ${selectedPostId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'}`}
          style={{ minHeight: '100vh' }}
        >
          {selectedPostId && (
            <div className="w-full h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
              <PostDetail
                postId={selectedPostId}
                onBack={() => setSelectedPostId(null)}
                isAuthenticated={isAuthenticated}
                onAuthRequired={handleAuthRequired}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
