'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAppStore, type View } from '@/lib/store';
import { BookOpen, Heart, Home, LogOut, Menu, MessageSquare, PenLine, Settings, Stethoscope, User, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// ── Brand palette (matches home-page.tsx) ────────────────────────────────────
const C1 = '#CAA69B';
const C2 = '#CB978E';
const C3 = '#D4B9B2';

const navItems: { label: string; view: View; icon: React.ReactNode }[] = [
  { label: 'Home',        view: 'home',    icon: <Home        className="h-4 w-4" /> },
  { label: 'Community',   view: 'feed',    icon: <Users       className="h-4 w-4" /> },
  { label: 'Learn',       view: 'learn',   icon: <BookOpen    className="h-4 w-4" /> },
  { label: 'Ask Experts', view: 'experts', icon: <MessageSquare className="h-4 w-4" /> },
];

export function Navbar() {
  const { currentView, setView, currentUser, isAuthenticated, logout } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('')
    : '?';

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-1 sm:px-8 sm:pt-5">
      <div
        className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 sm:px-6 backdrop-blur-md shadow-sm"
        style={{
          background: 'rgba(253, 246, 244, 0.95)',
          border: `1px solid #ecddd9`,
          boxShadow: '0 4px 24px rgba(203,151,142,0.10)',
        }}
      >

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Go to home"
        >
          {/* petal / heart mark */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
          >
            <Heart className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: '#3d2b27' }}>
            Heri<span style={{ color: C2 }}>zone</span>
          </span>
        </button>

        {/* ── Desktop nav ──────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="relative px-4 py-2 text-sm font-medium transition-colors rounded-full"
                style={{
                  color: isActive ? C2 : '#7a6360',
                  background: isActive ? `${C3}40` : 'transparent',
                }}
              >
                {item.label}
                {/* active underline dot */}
                {isActive && (
                  <span
                    className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: C2 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right side ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          {/* Join as Expert button — visible for guests and logged-in non-expert users */}
          {(!isAuthenticated || (currentUser && !currentUser.isExpert && !currentUser.isAdmin)) && (
            <Link
              href="/join-as-expert"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
              style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Join as Expert
            </Link>
          )}
          {isAuthenticated && currentUser ? (
            /* Profile dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors"
                  style={{ border: `1px solid #ecddd9`, background: 'white' }}
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback
                      className="text-xs font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium" style={{ color: '#3d2b27' }}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border shadow-lg"
                style={{ borderColor: '#ecddd9', background: '#fdf6f4' }}
              >
                <DropdownMenuItem
                  onClick={() => setView('profile')}
                  className="gap-2 cursor-pointer rounded-lg text-sm"
                  style={{ color: '#3d2b27' }}
                >
                  <User className="h-4 w-4" style={{ color: C1 }} />
                  My Profile
                </DropdownMenuItem>
                {currentUser?.isExpert && !currentUser?.isAdmin && (
                  <>
                    <DropdownMenuSeparator style={{ background: '#ecddd9' }} />
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="gap-2 cursor-pointer rounded-lg text-sm"
                      style={{ color: '#3d2b27' }}
                      asChild
                    >
                      <a href="/expert-articles">
                        <PenLine className="h-4 w-4" style={{ color: C1 }} />
                        My Articles
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                {currentUser?.isAdmin && (
                  <>
                    <DropdownMenuSeparator style={{ background: '#ecddd9' }} />
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="gap-2 cursor-pointer rounded-lg text-sm"
                      style={{ color: '#3d2b27' }}
                      asChild
                    >
                      <a href="/expert-articles">
                        <PenLine className="h-4 w-4" style={{ color: C1 }} />
                        My Articles
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="gap-2 cursor-pointer rounded-lg text-sm"
                      style={{ color: '#3d2b27' }}
                      asChild
                    >
                      <a href="/admin-articles">
                        <Settings className="h-4 w-4" style={{ color: C1 }} />
                        Review &amp; Manage
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                {!currentUser?.isExpert && !currentUser?.isAdmin && (
                  <>
                    <DropdownMenuSeparator style={{ background: '#ecddd9' }} />
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="gap-2 cursor-pointer rounded-lg text-sm"
                      style={{ color: '#3d2b27' }}
                      asChild
                    >
                      <a href="/join-as-expert">
                        <Stethoscope className="h-4 w-4" style={{ color: C1 }} />
                        Join as Expert
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator style={{ background: '#ecddd9' }} />
                <DropdownMenuItem
                  onClick={logout}
                  className="gap-2 cursor-pointer rounded-lg text-sm text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Auth buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white"
                style={{ color: C2, border: `1px solid ${C3}` }}
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
                style={{ background: C2 }}
              >
                Join free
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full md:hidden transition-colors"
                style={{ border: `1px solid #ecddd9`, background: 'white' }}
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" style={{ color: '#7a6360' }} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-64 border-l"
              style={{ borderColor: '#ecddd9', background: '#fdf6f4' }}
            >
              {/* mobile logo */}
              <div className="flex items-center gap-2.5 pb-6 pt-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
                >
                  <Heart className="h-4 w-4 text-white" fill="currentColor" />
                </div>
                <span className="text-base font-bold" style={{ color: '#3d2b27' }}>
                  Heri<span style={{ color: C2 }}>zone</span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => {
                        setView(item.view);
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left"
                      style={{
                        background: isActive ? `${C3}50` : 'transparent',
                        color: isActive ? C2 : '#7a6360',
                      }}
                    >
                      <span style={{ color: isActive ? C2 : C1 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {(!isAuthenticated || (currentUser && !currentUser.isExpert && !currentUser.isAdmin)) && (
                <div className="mt-6 px-1">
                  <Link
                    href="/join-as-expert"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
                  >
                    <Stethoscope className="h-4 w-4" />
                    Join as Expert
                  </Link>
                </div>
              )}
              {!isAuthenticated && (
                <div className="mt-6 flex flex-col gap-2 px-1">
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white"
                    style={{ borderColor: C3, color: C2 }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ background: C2 }}
                  >
                    Join free
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
