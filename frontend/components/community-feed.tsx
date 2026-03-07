'use client';

import { useState } from 'react';
import { useAppStore, type PostCategory } from '@/lib/store';
import { createCommunityComment, createCommunityPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  MessageCircle,
  Search,
  Plus,
  ArrowUpDown,
  User,
  Send,
  X,
  ChevronLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
const C2 = '#CB978E';

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onClick,
}: {
  post: ReturnType<typeof useAppStore.getState>['posts'][0];
  onClick: () => void;
}) {
  const { toggleLike } = useAppStore();

  return (
    <article
      className="group cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: '#ecddd9' }}
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
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(post.id);
          }}
          className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? '' : 'text-muted-foreground hover:text-foreground'}`}
          style={{ color: post.isLiked ? C2 : undefined }}
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

function PostDetail({ postId, onBack }: { postId: string; onBack: () => void }) {
  const { posts, postComments, setPostComments, setPosts, toggleLike, currentUser } = useAppStore();
  const post = posts.find((p) => p.id === postId);
  const comments = postComments[postId] || [];
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!post) return null;

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const created = await createCommunityComment(post.id, commentText.trim());
      setPostComments({
        ...postComments,
        [post.id]: [...(postComments[post.id] || []), created.comment],
      });
      setPosts(
        posts.map((item) =>
          item.id === post.id ? { ...item, commentCount: created.commentCount } : item
        )
      );
      setCommentText('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to post comment');
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
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: '#ecddd9' }}>
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
            onClick={() => toggleLike(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? '' : 'text-muted-foreground hover:text-foreground'}`}
            style={{ color: post.isLiked ? C2 : undefined }}
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
            <div key={comment.id} className="flex gap-3 rounded-xl border bg-white p-4" style={{ borderColor: '#ecddd9' }}>
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
        <div className="mt-4 flex gap-3 rounded-xl border bg-white p-4" style={{ borderColor: '#ecddd9' }}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {currentUser.name.slice(0, 2).toUpperCase()}
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
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Post Dialog ──────────────────────────────────────────────────────────

function NewPostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { setPosts } = useAppStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const post = await createCommunityPost({
        category,
        content: content.trim(),
        isAnonymous,
      });
      const latestPosts = useAppStore.getState().posts;
      setPosts([post, ...latestPosts]);
      setContent('');
      setCategory('general');
      setIsAnonymous(false);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to publish post');
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
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export function CommunityFeed() {
  const { postFilter, postSort, postSearch, setPostFilter, setPostSort, setPostSearch, getFilteredPosts } =
    useAppStore();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const filteredPosts = getFilteredPosts();

  if (selectedPostId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #f9ede9 0%, #f5e6e2 50%, #eeddd9 100%)',
          borderColor: '#ecddd9',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: C2 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C2 }}>
                Community
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Support Circle</h1>
            <p className="mt-1 text-sm text-gray-500">A safe space to share, ask, and support.</p>
          </div>
          <Button onClick={() => setNewPostOpen(true)} className="shrink-0 gap-1.5 text-white" style={{ background: C2 }}>
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
            className="h-10 rounded-xl border-[#ecddd9] bg-white pl-9 text-sm"
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
          <SelectTrigger className="h-10 w-full gap-1.5 rounded-xl border-[#ecddd9] bg-white text-sm sm:w-40">
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
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setPostFilter(cat.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              postFilter === cat.value
                ? 'border-[#cb978e] bg-[#cb978e] text-white'
                : 'border-[#ecddd9] bg-white text-gray-500 hover:border-[#cb978e]/40 hover:text-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">No posts found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {postSearch ? 'Try a different search term.' : 'Be the first to start the conversation.'}
            </p>
            <Button onClick={() => setNewPostOpen(true)} className="mt-4 gap-1.5" variant="outline">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => setSelectedPostId(post.id)} />
          ))
        )}
      </div>

      <NewPostDialog open={newPostOpen} onOpenChange={setNewPostOpen} />
    </div>
  );
}
