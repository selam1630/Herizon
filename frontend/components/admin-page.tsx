'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminExpertApplications,
  deleteAdminCommunityPost,
  deleteAdminExpertQuestion,
  fetchAdminCommunityPosts,
  fetchAdminExpertQuestions,
  fetchAdminUsers,
  reviewAdminExpertApplication,
  type AdminExpertApplication,
  type AdminCommunityPost,
  type AdminExpertQuestion,
  type AdminUser,
  updateUserRoles,
} from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

type AdminTab = 'experts' | 'users' | 'moderation';

export function AdminPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [tab, setTab] = useState<AdminTab>('experts');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<AdminExpertApplication[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [questions, setQuestions] = useState<AdminExpertQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [loadedUsers, loadedApplications, loadedPosts, loadedQuestions] = await Promise.all([
          fetchAdminUsers(false),
          fetchAdminExpertApplications(),
          fetchAdminCommunityPosts(),
          fetchAdminExpertQuestions(),
        ]);
        if (!active) return;
        setUsers(loadedUsers);
        setApplications(loadedApplications);
        setPosts(loadedPosts);
        setQuestions(loadedQuestions);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load admin dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === 'pending'),
    [applications]
  );

  async function reviewApplication(application: AdminExpertApplication, decision: 'approved' | 'rejected') {
    const key = `application-${application.id}-${decision}`;
    setBusyKey(key);
    setError('');
    try {
      const updated = await reviewAdminExpertApplication(application.id, { decision });
      setApplications((prev) => prev.map((item) => (item.id === application.id ? updated : item)));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === updated.userId ? { ...user, isExpert: decision === 'approved' } : user
        )
      );
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review application');
    } finally {
      setBusyKey('');
    }
  }

  async function toggleExpert(user: AdminUser) {
    const key = `expert-${user.id}`;
    setBusyKey(key);
    setError('');
    try {
      const updated = await updateUserRoles(user.id, { isExpert: !user.isExpert });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update expert role');
    } finally {
      setBusyKey('');
    }
  }

  async function toggleAdmin(user: AdminUser) {
    const key = `admin-${user.id}`;
    setBusyKey(key);
    setError('');
    try {
      const updated = await updateUserRoles(user.id, { isAdmin: !user.isAdmin });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update admin role');
    } finally {
      setBusyKey('');
    }
  }

  async function removePost(postId: string) {
    const key = `post-${postId}`;
    setBusyKey(key);
    setError('');
    try {
      await deleteAdminCommunityPost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete post');
    } finally {
      setBusyKey('');
    }
  }

  async function removeQuestion(questionId: string) {
    const key = `question-${questionId}`;
    setBusyKey(key);
    setError('');
    try {
      await deleteAdminExpertQuestion(questionId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete question');
    } finally {
      setBusyKey('');
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading admin data...</p>
      </main>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">You do not have admin access for this page.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify experts, manage user roles, and moderate community content.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={tab === 'experts' ? 'default' : 'outline'} size="sm" onClick={() => setTab('experts')}>
          Expert Verification
        </Button>
        <Button variant={tab === 'users' ? 'default' : 'outline'} size="sm" onClick={() => setTab('users')}>
          User Roles
        </Button>
        <Button variant={tab === 'moderation' ? 'default' : 'outline'} size="sm" onClick={() => setTab('moderation')}>
          Moderation
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {tab === 'experts' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expert Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApplications.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending applications right now.</p>
            )}
            {pendingApplications.map((application) => (
              <div key={application.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">{application.userName}</p>
                <p className="text-xs text-muted-foreground">{application.userEmail}</p>
                <p className="mt-2 text-xs text-foreground">
                  <span className="font-medium">Specialty:</span> {application.specialty}
                </p>
                <p className="mt-1 text-xs text-foreground">
                  <span className="font-medium">Credentials:</span> {application.credentials}
                </p>
                {application.motivation && (
                  <p className="mt-1 text-xs text-foreground">
                    <span className="font-medium">Motivation:</span> {application.motivation}
                  </p>
                )}
                {application.evidencePhotos.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium text-foreground">Evidence Photos:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {application.evidencePhotos.map((photo, index) => (
                        <a
                          key={`${application.id}-photo-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={`Evidence ${index + 1}`}
                            className="h-20 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void reviewApplication(application, 'approved')}
                    disabled={busyKey === `application-${application.id}-approved`}
                  >
                    {busyKey === `application-${application.id}-approved` ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void reviewApplication(application, 'rejected')}
                    disabled={busyKey === `application-${application.id}-rejected`}
                  >
                    {busyKey === `application-${application.id}-rejected` ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users & Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.isExpert && <Badge variant="secondary">Expert</Badge>}
                    {user.isAdmin && <Badge>Admin</Badge>}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void toggleExpert(user)}
                      disabled={busyKey === `expert-${user.id}`}
                    >
                      {user.isExpert ? 'Remove Expert' : 'Make Expert'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void toggleAdmin(user)}
                      disabled={busyKey === `admin-${user.id}` || user.id === currentUser.id}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'moderation' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Community Posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts available.</p>}
              {posts.map((post) => (
                <div key={post.id} className="rounded-md border border-border p-3">
                  <p className="line-clamp-3 text-sm text-foreground">{post.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {post.author} • {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="destructive"
                    onClick={() => void removePost(post.id)}
                    disabled={busyKey === `post-${post.id}`}
                  >
                    {busyKey === `post-${post.id}` ? 'Removing...' : 'Delete Post'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expert Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions available.</p>}
              {questions.map((question) => (
                <div key={question.id} className="rounded-md border border-border p-3">
                  <p className="line-clamp-3 text-sm text-foreground">{question.question}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {question.author} • {formatDistanceToNow(question.timestamp, { addSuffix: true })}
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="destructive"
                    onClick={() => void removeQuestion(question.id)}
                    disabled={busyKey === `question-${question.id}`}
                  >
                    {busyKey === `question-${question.id}` ? 'Removing...' : 'Delete Question'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
