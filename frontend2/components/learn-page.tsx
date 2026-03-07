'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type Article, type ArticleCategory } from '@/lib/store';
import {
    Apple,
    Baby,
    Bookmark,
    BookmarkCheck,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Clock,
    HeartPulse,
    Milk,
    Search,
    Stethoscope,
    Syringe,
    Tag,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ArticleCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',        label: 'All',        emoji: '📚' },
  { value: 'pregnancy',  label: 'Pregnancy',  emoji: '🤰' },
  { value: 'parenting',  label: 'Parenting',  emoji: '👶' },
  { value: 'health',     label: 'Health',     emoji: '🩺' },
  { value: 'nutrition',  label: 'Nutrition',  emoji: '🥗' },
];

const CATEGORY_META: Record<ArticleCategory, { color: string; bg: string; border: string }> = {
  pregnancy: { color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-200' },
  parenting: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  health:    { color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  nutrition: { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
};

// ── Background bubbles ────────────────────────────────────────────────────────

function BackgroundBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Baby       className="absolute -left-10 bottom-32 h-36 w-36 text-pink-300   opacity-30" />
      <Stethoscope className="absolute -right-8  top-48    h-28 w-28 text-teal-300  opacity-25" />
      <Apple      className="absolute left-12   -top-6     h-20 w-20 text-green-300 opacity-25" />
      <HeartPulse className="absolute right-16  bottom-10  h-24 w-24 text-red-300   opacity-25" />
      <Milk       className="absolute left-1/4  bottom-1/4 h-16 w-16 text-blue-200  opacity-20" />
      <Syringe    className="absolute right-1/3 top-1/3    h-16 w-16 text-purple-200 opacity-20" />
      <Baby       className="absolute right-2   top-16     h-14 w-14 text-pink-200  opacity-15" />
      <HeartPulse className="absolute left-3    top-1/2    h-12 w-12 text-rose-200  opacity-15" />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="h-4 w-20 rounded-full bg-muted mb-3" />
      <div className="h-4 w-full rounded bg-muted mb-2" />
      <div className="h-4 w-3/4 rounded bg-muted mb-4" />
      <div className="h-3 w-full rounded bg-muted mb-1.5" />
      <div className="h-3 w-5/6 rounded bg-muted mb-6" />
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
      </div>
    </div>
  );
}

// ── ArticleDetail ─────────────────────────────────────────────────────────────

function ArticleDetail({ article, onBack }: { article: Article; onBack: () => void }) {
  const { currentUser, toggleBookmark } = useAppStore();
  const isBookmarked = currentUser?.bookmarks.includes(article.id) ?? false;
  const meta = CATEGORY_META[article.category];

  return (
    <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to library
      </button>

      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-6 sm:p-8`}>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${meta.color} ${meta.bg} ${meta.border}`}
          >
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </Badge>
          <button
            onClick={() => toggleBookmark(article.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors shrink-0 ${
              isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" fill="currentColor" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <h1 className="text-xl font-bold text-foreground leading-snug sm:text-2xl">
          {article.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">{article.author}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime} min read
          </span>
        </div>

        <Separator className="my-5 opacity-50" />

        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {article.content || article.excerpt}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${meta.color} ${meta.bg} ${meta.border}`}
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LearnPage ─────────────────────────────────────────────────────────────────

export function LearnPage() {
  const {
    articleFilter,
    articleSearch,
    setArticleFilter,
    setArticleSearch,
    getFilteredArticles,
    fetchArticles,
    articlesLoading,
    articles,
    currentUser,
    toggleBookmark,
  } = useAppStore();

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filteredArticles = getFilteredArticles();
  const displayArticles = showBookmarks
    ? filteredArticles.filter((a) => currentUser?.bookmarks.includes(a.id))
    : filteredArticles;

  // Featured = newest article
  const featured = articles[0] ?? null;

  if (selectedArticle) {
    return (
      <>
        <BackgroundBubbles />
        <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundBubbles />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Hero Header ──────────────────────────────────────────────── */}
        <div className="mb-8 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #fdf0f0 0%, #f3e8f8 50%, #e8f4f0 100%)',
            border: '1px solid #f0dde0',
          }}
        >
          <div className="px-8 py-10 sm:py-12">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 mb-4">
                  <BookOpen className="h-3 w-3" />
                  Educational Library
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  Learn & Grow
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md">
                  Evidence-based articles from verified healthcare professionals — for every stage of your journey.
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                    {articles.length} articles available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-pink-400 inline-block" />
                    4 categories
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center h-24 w-24 rounded-2xl shrink-0"
                style={{ background: 'rgba(203,151,142,0.15)' }}>
                <BookOpen className="h-10 w-10" style={{ color: '#CB978E' }} />
              </div>
            </div>
          </div>

          {/* Featured article strip */}
          {featured && !articlesLoading && (
            <button
              onClick={() => setSelectedArticle(featured)}
              className="w-full flex items-center justify-between gap-4 px-8 py-4 text-left transition-colors hover:bg-white/40"
              style={{ borderTop: '1px solid rgba(203,151,142,0.2)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Featured
                </span>
                <span className="text-sm font-medium text-foreground truncate">{featured.title}</span>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 hidden sm:inline-flex ${CATEGORY_META[featured.category].color} ${CATEGORY_META[featured.category].bg} ${CATEGORY_META[featured.category].border}`}
                >
                  {featured.category}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>

        {/* ── Controls row ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles or tags…"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="pl-9 h-10 text-sm bg-card"
            />
            {articleSearch && (
              <button
                onClick={() => setArticleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Saved toggle */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all shrink-0 ${
              showBookmarks
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={showBookmarks}
          >
            {showBookmarks ? (
              <BookmarkCheck className="h-4 w-4" fill="currentColor" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            Saved ({currentUser?.bookmarks.length ?? 0})
          </button>
        </div>

        {/* ── Category pills ────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setArticleFilter(cat.value)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                articleFilter === cat.value
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Articles grid ─────────────────────────────────────────────── */}
        {articlesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-semibold text-foreground">No articles found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {showBookmarks
                ? 'Save articles to find them here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayArticles.map((article) => {
              const isBookmarked = currentUser?.bookmarks.includes(article.id) ?? false;
              const meta = CATEGORY_META[article.category];
              return (
                <article
                  key={article.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md cursor-pointer overflow-hidden"
                  onClick={() => setSelectedArticle(article)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(article)}
                  role="button"
                  aria-label={`Read article: ${article.title}`}
                >
                  {/* Colored top stripe */}
                  <div className={`absolute inset-x-0 top-0 h-1 ${meta.bg.replace('bg-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`}
                    style={{ background: article.category === 'pregnancy' ? '#f9a8d4' : article.category === 'parenting' ? '#c4b5fd' : article.category === 'health' ? '#5eead4' : '#86efac' }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 font-semibold ${meta.color} ${meta.bg} ${meta.border}`}
                    >
                      {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                      className={`shrink-0 transition-colors ${
                        isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-4 w-4" fill="currentColor" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <h2 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1 mb-2">
                    {article.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3 flex-1">
                    {article.excerpt}
                  </p>

                  {/* Tags row */}
                  {article.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span className="font-medium text-foreground/70 truncate pr-2">{article.author}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {article.readTime} min
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
