'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, MessageCircleQuestion, Sparkles, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const C1 = '#CAA69B';
const C2 = '#CB978E';
const C3 = '#D4B9B2';

export function DashboardPage() {
  const { currentUser, posts, questions, articles, setView, setChatOpen } = useAppStore();

  const recentPosts = useMemo(
    () => [...posts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4),
    [posts]
  );

  const pendingQuestions = useMemo(
    () =>
      [...questions]
        .filter((q) => q.answerCount === 0)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 4),
    [questions]
  );

  const recommendedArticles = useMemo(
    () => [...articles].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 3),
    [articles]
  );

  const firstName = currentUser.name.split(' ')[0] ?? 'Mama';

  return (
    <main className="flex-1 font-sans">
      <section
        className="relative overflow-hidden px-4 pb-14 pt-10 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(135deg, #f9ede9 0%, #f5e6e2 50%, #eeddd9 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-20"
          style={{ background: C2 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full opacity-10"
          style={{ background: C1 }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: C2 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C2 }}>
                Your Dashboard
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl">
              Welcome back, <span style={{ color: C2 }}>{firstName}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Here is your latest community activity, unanswered expert questions, and recommended reading.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => setView('feed')}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-105"
                style={{ background: C2 }}
              >
                <Users className="h-4 w-4" />
                Community
              </button>
              <button
                onClick={() => setView('experts')}
                className="flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all hover:bg-white/60"
                style={{ borderColor: C1, color: C2 }}
              >
                <MessageCircleQuestion className="h-4 w-4" />
                Ask Expert
              </button>
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all hover:bg-white/60"
                style={{ borderColor: C1, color: C2 }}
              >
                <Sparkles className="h-4 w-4" />
                AI Support
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Posts', value: posts.length },
              { label: 'Open Questions', value: pendingQuestions.length },
              { label: 'Articles', value: articles.length },
              { label: 'Your Bookmarks', value: currentUser.bookmarks.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border bg-white/80 px-4 py-4 text-center shadow-sm"
                style={{ borderColor: '#ecddd9' }}
              >
                <p className="text-2xl font-black leading-none" style={{ color: C2 }}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8" style={{ background: '#fdf6f4' }}>
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2" style={{ borderColor: '#ecddd9' }}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold" style={{ color: C2 }}>Recent Community Posts</h2>
              <button className="text-xs font-semibold" style={{ color: C2 }} onClick={() => setView('feed')}>
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="rounded-xl border p-3" style={{ borderColor: '#ecddd9', background: '#fffafb' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{post.isAnonymous ? 'Anonymous' : post.author}</p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{post.content}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#ecddd9' }}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold" style={{ color: C2 }}>Pending Expert Replies</h2>
              <button className="text-xs font-semibold" style={{ color: C2 }} onClick={() => setView('experts')}>
                Open Q&A
              </button>
            </div>
            <div className="space-y-3">
              {pendingQuestions.length === 0 && (
                <p className="rounded-xl border p-3 text-sm text-gray-500" style={{ borderColor: '#ecddd9', background: '#fffafb' }}>
                  No pending questions.
                </p>
              )}
              {pendingQuestions.map((q) => (
                <div key={q.id} className="rounded-xl border p-3" style={{ borderColor: '#ecddd9', background: '#fffafb' }}>
                  <p className="line-clamp-2 text-sm text-gray-700">{q.question}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(q.timestamp, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8" style={{ background: '#fdf6f4' }}>
        <div className="mx-auto max-w-6xl rounded-3xl border bg-white p-6 shadow-sm sm:p-7" style={{ borderColor: '#ecddd9' }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-800">
              Recommended <span style={{ color: C2 }}>Reading</span>
            </h2>
            <button
              onClick={() => setView('learn')}
              className="inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: C2 }}
            >
              Go to library
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {recommendedArticles.map((article) => (
              <div key={article.id} className="rounded-2xl border p-4" style={{ borderColor: '#ecddd9', background: '#fffafb' }}>
                <p className="line-clamp-2 text-sm font-semibold text-gray-800">{article.title}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {article.category}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="h-3 w-3" />
                    {article.readTime} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
