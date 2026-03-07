'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, type Article, type ArticleCategory, type ExpertApplication } from '@/lib/store';
import {
    AlertTriangle,
    Baby,
    BookOpen,
    Check,
    ChevronLeft,
    Edit,
    HeartPulse,
    Loader2,
    Plus,
    Save,
    Search,
    Stethoscope,
    Tag,
    Trash2,
    User,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Tab = 'queue' | 'published' | 'applications';

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

function categoryColor(cat: ArticleCategory) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? 'bg-gray-100 text-gray-600';
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
          <h2 className="font-semibold text-foreground">{initial ? 'Edit Article' : 'New Article'}</h2>
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
          <textarea rows={10} placeholder="Write the article content here…" value={form.content} onChange={(e) => set('content', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[200px]" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initial ? 'Save Changes' : 'Publish Article'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Application Card ──────────────────────────────────────────────────────────
function ApplicationCard({
  app,
  onApprove,
  onReject,
  loading,
}: {
  app: ExpertApplication;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const statusColor =
    app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
    app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
    'bg-yellow-100 text-yellow-700 border-yellow-200';

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{app.userName ?? 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{app.userEmail}</span>
            <Badge variant="outline" className={`text-xs ml-auto ${statusColor}`}>{app.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5"><strong>Specialty:</strong> {app.specialty}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/40 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <p><strong className="text-foreground">Experience:</strong> {app.yearsOfExperience} yrs</p>
          <p><strong className="text-foreground">Rate:</strong> ${app.priceMin} – ${app.priceMax}/hr</p>
          {app.licenseNumber && (
            <p className="col-span-2"><strong className="text-foreground">License:</strong> {app.licenseNumber}</p>
          )}
        </div>
        <p><strong className="text-foreground">Credentials:</strong> {app.credentials}</p>
        <p><strong className="text-foreground">Bio:</strong> {app.bio}</p>
      </div>
      {app.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onApprove} disabled={loading} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={loading} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminArticlesPage() {
  const {
    articles, fetchArticles, articlesLoading,
    pendingArticles, pendingArticlesLoading, fetchPendingArticles,
    createArticle, updateArticle, deleteArticle, publishArticle, rejectArticle,
    expertApplications, fetchExpertApplications, approveExpertApplication, rejectExpertApplication,
    currentUser,
  } = useAppStore();

  const [tab, setTab] = useState<Tab>('queue');
  const [formView, setFormView] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [appLoadingId, setAppLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchPendingArticles();
    fetchExpertApplications();
  }, [fetchArticles, fetchPendingArticles, fetchExpertApplications]);

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-destructive/10 p-5 mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Admin Access Required</h2>
        <p className="mt-1 text-sm text-muted-foreground">You must be an admin to access this page.</p>
      </div>
    );
  }

  const publishedArticles = articles.filter((a) => a.status === 'published');
  const filteredPublished = publishedArticles.filter(
    (a) => !search.trim() || a.title.toLowerCase().includes(search.toLowerCase())
  );
  const pendingApps = expertApplications.filter((a) => a.status === 'pending');

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
      setFormView(false); setEditingArticle(null);
    } finally { setSaving(false); }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try { await publishArticle(id); } finally { setPublishingId(null); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and remove this article from the queue?')) return;
    setRejectingId(id);
    try { await rejectArticle(id); } finally { setRejectingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this article?')) return;
    setDeletingId(id);
    try { await deleteArticle(id); } finally { setDeletingId(null); }
  };

  const handleApproveApp = async (id: string) => {
    setAppLoadingId(id);
    try { await approveExpertApplication(id); } finally { setAppLoadingId(null); }
  };

  const handleRejectApp = async (id: string) => {
    setAppLoadingId(id);
    try { await rejectExpertApplication(id); } finally { setAppLoadingId(null); }
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-5 w-5 text-primary" /></div>
              <h1 className="text-2xl font-bold text-foreground">Content Manager</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-11">Review expert submissions, manage published articles, approve experts.</p>
          </div>
          {tab === 'published' && !formView && (
            <Button onClick={handleNew} className="gap-2 shrink-0"><Plus className="h-4 w-4" />New Article</Button>
          )}
          {formView && (
            <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />Back to list
            </button>
          )}
        </div>

        {/* Tabs */}
        {!formView && (
          <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
            {([
              { key: 'queue', label: 'Review Queue', count: pendingArticles.length },
              { key: 'published', label: 'Published', count: publishedArticles.length },
              { key: 'applications', label: 'Expert Applications', count: pendingApps.length },
            ] as const).map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Form (published tab) */}
        {formView && (
          <ArticleFormPanel initial={editingArticle} onSave={handleSave} onCancel={handleCancel} saving={saving} />
        )}

        {/* ── REVIEW QUEUE ── */}
        {!formView && tab === 'queue' && (
          <>
            {pendingArticlesLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading queue…</span>
              </div>
            ) : pendingArticles.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-border">
                <Check className="mx-auto h-10 w-10 text-green-400/60" />
                <p className="mt-3 text-sm font-medium text-foreground">All clear! No articles awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingArticles.map((article) => (
                  <div key={article.id} className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 shrink-0 rounded-lg p-2 ${categoryColor(article.category)}`}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground flex-1">{article.title}</h3>
                          <Badge variant="outline" className={`text-xs shrink-0 ${categoryColor(article.category)}`}>{article.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">By <strong>{article.author}</strong> · {article.timestamp.toLocaleDateString()}</p>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{article.content}</p>
                        {article.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {article.tags.slice(0, 5).map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                <Tag className="h-2.5 w-2.5" />{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => handlePublish(article.id)} disabled={publishingId === article.id}
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                        {publishingId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(article)}
                        className="gap-1.5"><Edit className="h-3.5 w-3.5" />Edit & Publish</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(article.id)} disabled={rejectingId === article.id}
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 ml-auto">
                        {rejectingId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PUBLISHED ── */}
        {!formView && tab === 'published' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {CATEGORIES.map((cat) => {
                const count = publishedArticles.filter((a) => a.category === cat.value).length;
                return (
                  <div key={cat.value} className={`rounded-xl border p-3 ${cat.color} border-opacity-50`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium mt-0.5">{cat.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            {articlesLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading…</span>
              </div>
            ) : filteredPublished.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-border">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">{search ? 'No articles match.' : 'No published articles yet.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPublished.map((article) => (
                  <div key={article.id} className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className={`mt-1 shrink-0 rounded-lg p-2 ${categoryColor(article.category)}`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">{article.title}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${categoryColor(article.category)}`}>{article.category}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">By {article.author}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {article.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(article)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(article.id)} disabled={deletingId === article.id}>
                        {deletingId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── EXPERT APPLICATIONS ── */}
        {!formView && tab === 'applications' && (
          <div className="space-y-4">
            {expertApplications.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-border">
                <User className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">No expert applications yet.</p>
              </div>
            ) : (
              <>
                {pendingApps.length > 0 && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending ({pendingApps.length})</p>}
                {expertApplications.map((app) => (
                  <ApplicationCard key={app.id} app={app}
                    onApprove={() => handleApproveApp(app.id)}
                    onReject={() => handleRejectApp(app.id)}
                    loading={appLoadingId === app.id} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

