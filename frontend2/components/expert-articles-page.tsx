'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, type Article, type ArticleCategory } from '@/lib/store';
import {
    AlertTriangle,
    Baby,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Edit,
    HeartPulse,
    Loader2,
    Plus,
    Send,
    Stethoscope,
    Tag,
    Trash2,
    X,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

type ArticleForm = {
  title: string;
  content: string;
  category: ArticleCategory;
  tags: string;
};

const EMPTY_FORM: ArticleForm = { title: '', content: '', category: 'pregnancy', tags: '' };

const CATEGORIES: { value: ArticleCategory; label: string; color: string }[] = [
  { value: 'pregnancy', label: 'Pregnancy', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'parenting', label: 'Parenting', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'health', label: 'Health', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'nutrition', label: 'Nutrition', color: 'bg-green-100 text-green-700 border-green-200' },
];

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  published:      { label: 'Published',       color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle2 },
  rejected:       { label: 'Rejected',        color: 'bg-red-100 text-red-700 border-red-200',        icon: XCircle },
  draft:          { label: 'Draft',           color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: Edit },
};

function categoryColor(cat: ArticleCategory) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? 'bg-gray-100 text-gray-600';
}

function StatusBadge({ status }: { status: Article['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Article Form Panel ────────────────────────────────────────────────────────
function ArticleFormPanel({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Article | null;
  onSave: (data: ArticleForm) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ArticleForm>(
    initial
      ? { title: initial.title, content: initial.content, category: initial.category, tags: initial.tags.join(', ') }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');

  const set = (key: keyof ArticleForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    setError('');
    await onSave(form);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-4 w-4 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-foreground">{initial ? 'Edit Article' : 'Write New Article'}</h2>
            <p className="text-[11px] text-muted-foreground">Your article will be reviewed by an admin before publishing.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {/* Info banner */}
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-700">
          <Send className="h-3.5 w-3.5 shrink-0" />
          Submitting will send your article for admin review. It will be visible to the public once approved.
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
          <Input placeholder="Article title…" value={form.title} onChange={(e) => set('title', e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-all ${form.category === cat.value ? cat.color + ' ring-2 ring-offset-1 ring-primary/30' : 'border-border bg-muted text-muted-foreground hover:border-primary/40'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags <span className="normal-case font-normal">(comma separated)</span></label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="e.g. prenatal, nutrition, sleep" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="pl-8 h-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</label>
          <textarea rows={12} placeholder="Write your article content here. Share your expertise!" value={form.content} onChange={(e) => set('content', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[240px]" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {initial ? 'Resubmit for Review' : 'Submit for Review'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Main Expert Articles Page ─────────────────────────────────────────────────
export default function ExpertArticlesPage() {
  const {
    articles, articlesLoading, fetchMyArticles,
    createArticle, updateArticle, deleteArticle,
    currentUser,
  } = useAppStore();

  const [formView, setFormView] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyArticles();
  }, [fetchMyArticles]);

  // Guard: must be expert or admin
  if (!currentUser?.isExpert && !currentUser?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-yellow-100 p-5 mb-4">
          <BookOpen className="h-10 w-10 text-yellow-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Expert Access Required</h2>
        <p className="mt-1 text-sm text-muted-foreground">You need to be a verified expert to write articles.</p>
      </div>
    );
  }

  const handleNew = () => { setEditingArticle(null); setFormView(true); };
  const handleEdit = (a: Article) => { setEditingArticle(a); setFormView(true); };
  const handleCancel = () => { setFormView(false); setEditingArticle(null); };

  const handleSave = async (form: ArticleForm) => {
    setSaving(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (editingArticle) {
        await updateArticle(editingArticle.id, { title: form.title, content: form.content, category: form.category, tags });
      } else {
        await createArticle({ title: form.title, content: form.content, category: form.category, tags });
      }
      setFormView(false);
      setEditingArticle(null);
      await fetchMyArticles();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    setDeletingId(id);
    try { await deleteArticle(id); } finally { setDeletingId(null); }
  };

  const counts = {
    pending_review: articles.filter((a) => a.status === 'pending_review').length,
    published: articles.filter((a) => a.status === 'published').length,
    rejected: articles.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background bubbles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Baby className="absolute left-[-48px] bottom-24 w-32 h-32 text-pink-200 opacity-40" />
        <Stethoscope className="absolute right-[-40px] top-40 w-28 h-28 text-teal-200 opacity-30" />
        <HeartPulse className="absolute right-20 bottom-10 w-24 h-24 text-red-200 opacity-25" />
        <BookOpen className="absolute left-16 top-8 w-20 h-20 text-purple-200 opacity-25" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-5 w-5 text-primary" /></div>
              <h1 className="text-2xl font-bold text-foreground">My Articles</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-11">Write and manage your educational content for the Herizone library.</p>
          </div>
          {!formView && (
            <Button onClick={handleNew} className="gap-2 shrink-0"><Plus className="h-4 w-4" />Write Article</Button>
          )}
          {formView && (
            <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />Back to my articles
            </button>
          )}
        </div>

        {/* Stats */}
        {!formView && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-3">
              <div className="text-2xl font-bold text-yellow-700">{counts.pending_review}</div>
              <div className="text-xs font-medium text-yellow-600 mt-0.5">Pending Review</div>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-3">
              <div className="text-2xl font-bold text-green-700">{counts.published}</div>
              <div className="text-xs font-medium text-green-600 mt-0.5">Published</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
              <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
              <div className="text-xs font-medium text-red-600 mt-0.5">Rejected</div>
            </div>
          </div>
        )}

        {/* Form */}
        {formView && (
          <ArticleFormPanel initial={editingArticle} onSave={handleSave} onCancel={handleCancel} saving={saving} />
        )}

        {/* Article list */}
        {!formView && (
          <>
            {articlesLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading your articles…</span>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-border">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">No articles yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Write your first article to share your expertise!</p>
                <Button onClick={handleNew} size="sm" className="mt-4 gap-2">
                  <Plus className="h-3.5 w-3.5" />Write your first article
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div key={article.id}
                    className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className={`mt-1 shrink-0 rounded-lg p-2 ${categoryColor(article.category)}`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">{article.title}</h3>
                        <StatusBadge status={article.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] ${categoryColor(article.category)}`}>{article.category}</Badge>
                        <span className="text-xs text-muted-foreground">{article.timestamp.toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">· {article.readTime} min read</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      {article.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              <Tag className="h-2.5 w-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Only allow editing non-published articles */}
                      {article.status !== 'published' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(article)} aria-label="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {article.status !== 'published' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(article.id)} disabled={deletingId === article.id} aria-label="Delete">
                          {deletingId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
