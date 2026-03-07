'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircleQuestion, Sparkles, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DashboardPage() {
  const { currentUser, posts, questions, articles, setView, setChatOpen } = useAppStore();

  const recentPosts = useMemo(
    () => [...posts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4),
    [posts]
  );

  const pendingQuestions = useMemo(
    () => [...questions].filter((q) => q.answerCount === 0).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4),
    [questions]
  );

  const recommendedArticles = useMemo(
    () => [...articles].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 3),
    [articles]
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {currentUser.name.split(' ')[0]}. Here is your latest activity and next actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setView('feed')}>
            <Users className="mr-1 h-4 w-4" /> Community
          </Button>
          <Button size="sm" variant="outline" onClick={() => setView('experts')}>
            <MessageCircleQuestion className="mr-1 h-4 w-4" /> Ask Expert
          </Button>
          <Button size="sm" variant="outline" onClick={() => setChatOpen(true)}>
            <Sparkles className="mr-1 h-4 w-4" /> AI Support
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Community Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{post.isAnonymous ? 'Anonymous' : post.author}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{post.content}</p>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setView('feed')}>View all posts</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Expert Replies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending questions.</p>
            )}
            {pendingQuestions.map((q) => (
              <div key={q.id} className="rounded-md border border-border p-3">
                <p className="line-clamp-2 text-sm text-foreground">{q.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(q.timestamp, { addSuffix: true })}
                </p>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setView('experts')}>Open Expert Q&A</Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended Reading</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {recommendedArticles.map((article) => (
              <div key={article.id} className="rounded-md border border-border p-3">
                <p className="line-clamp-2 text-sm font-medium text-foreground">{article.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                  <span className="text-xs text-muted-foreground">{article.readTime} min</span>
                </div>
              </div>
            ))}
            <div className="sm:col-span-3">
              <Button variant="ghost" size="sm" onClick={() => setView('learn')}>Go to library</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
