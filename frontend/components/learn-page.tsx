'use client';

import { useState } from 'react';
import { useAppStore, type ArticleCategory } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Search,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  X,
  Tag,
  ChevronRight,
} from 'lucide-react';

const C2 = '#CB978E';
const C1 = '#CAA69B';

const CATEGORIES: { value: ArticleCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📚' },
  { value: 'pregnancy', label: 'Pregnancy', emoji: '🤰' },
  { value: 'parenting', label: 'Parenting', emoji: '👶' },
  { value: 'health', label: 'Health', emoji: '🩺' },
  { value: 'nutrition', label: 'Nutrition', emoji: '🥗' },
];

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  pregnancy: 'bg-pink-100 text-pink-700 border-pink-200',
  parenting: 'bg-purple-100 text-purple-700 border-purple-200',
  health: 'bg-teal-100 text-teal-700 border-teal-200',
  nutrition: 'bg-green-100 text-green-700 border-green-200',
};

function ArticleDetail({ articleId, onBack }: { articleId: string; onBack: () => void }) {
  const { articles, currentUser, toggleBookmark } = useAppStore();
  const article = articles.find((a) => a.id === articleId);

  if (!article) return null;

  const isBookmarked = currentUser.bookmarks.includes(articleId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to library
      </button>

      <div className="rounded-2xl border bg-white p-6 sm:p-8" style={{ borderColor: '#ecddd9' }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[article.category]}`}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </Badge>
          <button
            onClick={() => toggleBookmark(article.id)}
            className={`flex shrink-0 items-center gap-1.5 text-sm transition-colors ${
              isBookmarked ? '' : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ color: isBookmarked ? C2 : undefined }}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" fill="currentColor" /> : <Bookmark className="h-4 w-4" />}
            {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>

        <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">{article.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{article.author}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime} min read
          </span>
        </div>

        <Separator className="my-5" />

        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {article.content || article.excerpt}
        </div>

        {article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
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

export function LearnPage() {
  const {
    articleFilter,
    articleSearch,
    setArticleFilter,
    setArticleSearch,
    getFilteredArticles,
    currentUser,
    toggleBookmark,
    articles,
  } = useAppStore();

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const filteredArticles = getFilteredArticles();
  const displayArticles = showBookmarks
    ? filteredArticles.filter((a) => currentUser.bookmarks.includes(a.id))
    : filteredArticles;

  const featured = articles[0] ?? null;

  if (selectedArticleId) {
    return <ArticleDetail articleId={selectedArticleId} onBack={() => setSelectedArticleId(null)} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="mb-7 overflow-hidden rounded-3xl border"
        style={{
          background: 'linear-gradient(135deg, #f9ede9 0%, #f5e6e2 50%, #eeddd9 100%)',
          borderColor: '#ecddd9',
        }}
      >
        <div className="px-8 py-10 sm:py-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
                <BookOpen className="h-3 w-3" />
                Educational Library
              </div>
              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Learn & Grow</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
                Evidence-based articles from verified healthcare professionals.
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  {articles.length} articles available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-pink-400" />
                  4 categories
                </span>
              </div>
            </div>
            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl sm:flex" style={{ background: 'rgba(203,151,142,0.15)' }}>
              <BookOpen className="h-10 w-10" style={{ color: C2 }} />
            </div>
          </div>
        </div>

        {featured && (
          <button
            onClick={() => setSelectedArticleId(featured.id)}
            className="flex w-full items-center justify-between gap-4 px-8 py-4 text-left transition-colors hover:bg-white/40"
            style={{ borderTop: '1px solid rgba(203,151,142,0.2)' }}
          >
            <div className="min-w-0 flex items-center gap-3">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured</span>
              <span className="truncate text-sm font-medium text-foreground">{featured.title}</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles or tags..."
            value={articleSearch}
            onChange={(e) => setArticleSearch(e.target.value)}
            className="h-10 rounded-xl border-[#ecddd9] bg-white pl-9 text-sm"
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

        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
            showBookmarks
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-[#ecddd9] bg-white text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={showBookmarks}
        >
          {showBookmarks ? <BookmarkCheck className="h-4 w-4" fill="currentColor" /> : <Bookmark className="h-4 w-4" />}
          Saved ({currentUser.bookmarks.length})
        </button>
      </div>

      <div className="mb-7 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setArticleFilter(cat.value)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              articleFilter === cat.value
                ? 'border-[#cb978e] bg-[#cb978e] text-white shadow-sm'
                : 'border-[#ecddd9] bg-white text-gray-500 hover:border-[#cb978e]/40 hover:text-gray-700'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {displayArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-semibold text-foreground">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {showBookmarks ? 'Save articles to see them here.' : 'Try adjusting your search or filter.'}
          </p>
          {!showBookmarks && (
            <Button onClick={() => setArticleFilter('all')} className="mt-4" variant="outline">
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayArticles.map((article) => {
            const isBookmarked = currentUser.bookmarks.includes(article.id);
            return (
              <article
                key={article.id}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: '#ecddd9' }}
                onClick={() => setSelectedArticleId(article.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedArticleId(article.id)}
                role="button"
                aria-label={`Read article: ${article.title}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: C1 }} />

                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge variant="outline" className={`shrink-0 text-xs ${CATEGORY_COLORS[article.category]}`}>
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`shrink-0 transition-colors ${isBookmarked ? '' : 'text-muted-foreground hover:text-foreground'}`}
                    style={{ color: isBookmarked ? C2 : undefined }}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                  >
                    {isBookmarked ? <BookmarkCheck className="h-4 w-4" fill="currentColor" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>

                <h2 className="mb-2 line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground">{article.title}</h2>
                <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{article.excerpt}</p>

                {article.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="truncate pr-2 font-medium text-foreground/70">{article.author}</span>
                  <span className="flex shrink-0 items-center gap-1">
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
  );
}
