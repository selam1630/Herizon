'use client';

import { useAppStore, type View } from '@/lib/store';
import { Heart, Mail, Instagram, Twitter, Youtube } from 'lucide-react';

const LINKS: { heading: string; items: { label: string; view?: View; href?: string }[] }[] = [
  {
    heading: 'Platform',
    items: [
      { label: 'Community', view: 'feed' },
      { label: 'Learn', view: 'learn' },
      { label: 'Ask Experts', view: 'experts' },
      { label: 'My Profile', view: 'profile' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { label: 'Pregnancy Guide', view: 'learn' },
      { label: 'Parenting Tips', view: 'learn' },
      { label: 'Mental Health', view: 'learn' },
      { label: 'Nutrition', view: 'learn' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About Herizon', href: '#' },
      { label: 'Our Experts', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help Center', href: '#' },
      { label: 'Community Guidelines', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'Twitter / X', icon: Twitter, href: '#' },
  { label: 'YouTube', icon: Youtube, href: '#' },
  { label: 'Email', icon: Mail, href: 'mailto:hello@herizon.app' },
];

export function Footer() {
  const { setView } = useAppStore();

  return (
    <footer className="border-t border-border bg-card">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand column — spans 2 of 6 */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Logo */}
            <button
              onClick={() => setView('home')}
              className="flex w-fit items-center gap-2.5"
              aria-label="Go to Herizon home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Heart className="h-4.5 w-4.5 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Herizon</span>
            </button>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A safe, supportive space for every mother — from the first trimester to toddlerhood and beyond.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            {/* Newsletter pill */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Weekly newsletter</p>
                <p className="text-[11px] text-muted-foreground">Tips, stories, expert insights.</p>
              </div>
              <a
                href="#"
                className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Subscribe
              </a>
            </div>
          </div>

          {/* Link columns */}
          {LINKS.map(({ heading, items }) => (
            <div key={heading} className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map(({ label, view, href }) => (
                  <li key={label}>
                    {view ? (
                      <button
                        onClick={() => setView(view)}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </button>
                    ) : (
                      <a
                        href={href ?? '#'}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} Herizon. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="h-3 w-3 fill-primary text-primary" />
            <span>for every mother</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
