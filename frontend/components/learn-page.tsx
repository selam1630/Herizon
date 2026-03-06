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
} from 'lucide-react';

const CATEGORIES: { value: ArticleCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'health', label: 'Health' },
  { value: 'nutrition', label: 'Nutrition' },
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to library
      </button>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[article.category]}`}>
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
            {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>

        <h1 className="text-xl font-semibold text-foreground leading-snug sm:text-2xl">
          {article.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{article.author}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime} min read
          </span>
        </div>

        <Separator className="my-5" />

        <p className="text-sm leading-relaxed text-foreground/90">
          {article.excerpt}
        </p>

        {/* Article body placeholder — replace with real markdown content */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/80">
          <p>
            This is where the full article content would appear. In production, this field would
            contain rich markdown content rendered with a library such as{' '}
            <span className="font-medium text-foreground">react-markdown</span> or a CMS-sourced
            HTML string.
          </p>
          <p>
            The article covers evidence-based guidance written and reviewed by verified healthcare
            professionals. All content includes appropriate disclaimers advising readers to consult
            their own healthcare provider for personal medical decisions.
          </p>
          <p>
            Topics are updated regularly as new research emerges, and each article is tagged for
            discoverability across the educational library.
          </p>
        </div>

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
      </div>
    </div>
  );
}

export function LearnPage() {
  const { articleFilter, articleSearch, setArticleFilter, setArticleSearch, getFilteredArticles, currentUser, toggleBookmark } =
    useAppStore();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const filteredArticles = getFilteredArticles();
  const displayArticles = showBookmarks
    ? filteredArticles.filter((a) => currentUser.bookmarks.includes(a.id))
    : filteredArticles;

  if (selectedArticleId) {
    return <ArticleDetail articleId={selectedArticleId} onBack={() => setSelectedArticleId(null)} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Educational Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Evidence-based articles from verified healthcare professionals.
          </p>
        </div>
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
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
          Saved ({currentUser.bookmarks.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search articles or tags..."
          value={articleSearch}
          onChange={(e) => setArticleSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
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

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setArticleFilter(cat.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              articleFilter === cat.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {displayArticles.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {showBookmarks ? 'Save articles to see them here.' : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayArticles.map((article) => {
            const isBookmarked = currentUser.bookmarks.includes(article.id);
            return (
              <article
                key={article.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
                onClick={() => setSelectedArticleId(article.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedArticleId(article.id)}
                role="button"
                aria-label={`Read article: ${article.title}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_COLORS[article.category]}`}>
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

                <h2 className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
                  {article.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
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
  );
}
