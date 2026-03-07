'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { BookmarkCheck, Check, Heart, MessageCircle, Pencil } from 'lucide-react';
import { useState } from 'react';

export function ProfilePage() {
  const { currentUser, updateProfile, posts, articles } = useAppStore();

  // Guard — should not be reachable when logged out, but just in case
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [saving, setSaving] = useState(false);

  const userPosts = posts.filter((p) => p.authorId === currentUser.id);
  const savedArticles = articles.filter((a) => currentUser.bookmarks.includes(a.id));
  const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ name: name.trim() || currentUser.name, bio: bio.trim() });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(currentUser.name);
    setBio(currentUser.bio);
    setEditing(false);
  };

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">My Profile</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!editing && (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{currentUser.name}</h2>
                  {currentUser.isExpert && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      Expert
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {currentUser.bio || 'No bio yet.'}
                </p>
              </div>
            )}
          </div>

          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="shrink-0 gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name" className="text-sm font-medium">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm"
                maxLength={60}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="resize-none text-sm min-h-[80px]"
                placeholder="Tell the community a bit about yourself..."
                maxLength={300}
              />
              <p className="text-right text-xs text-muted-foreground">{bio.length}/300</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} size="sm">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Posts', value: userPosts.length, icon: MessageCircle },
          { label: 'Likes received', value: totalLikes, icon: Heart },
          { label: 'Saved articles', value: savedArticles.length, icon: BookmarkCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-5 gap-1"
          >
            <Icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* My posts */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-foreground">My Posts ({userPosts.length})</h3>
        {userPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t posted yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2 flex-1">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved articles */}
      {savedArticles.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Saved Articles ({savedArticles.length})
          </h3>
          <div className="flex flex-col gap-2">
            {savedArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <BookmarkCheck className="h-4 w-4 text-primary shrink-0" fill="currentColor" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                  <p className="text-xs text-muted-foreground">{article.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-8" />

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h3 className="text-sm font-medium text-destructive">Account</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign out of your account or manage your data.
        </p>
        <Button variant="outline" size="sm" className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
