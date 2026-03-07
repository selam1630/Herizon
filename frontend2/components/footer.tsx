'use client';

import { useAppStore, type View } from '@/lib/store';
import { Heart, Instagram, Mail, Twitter, Youtube } from 'lucide-react';
import { useState } from 'react';

// ── Brand palette ─────────────────────────────────────────────────────────────
const C1 = '#CAA69B';
const C2 = '#CB978E';
const C3 = '#D4B9B2';
const BG = '#fdf6f4'; // warm cream — easy to read on

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
      { label: 'About Herizone', href: '#' },
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
  { label: 'Email', icon: Mail, href: 'mailto:hello@herizone.app' },
];

export function Footer() {
  const { setView } = useAppStore();
  const [email, setEmail] = useState('');

  return (
    <footer className="relative" style={{ background: BG }}>

      {/* ── Main footer body — cream bg, photos anchored left/right bottom ── */}
      <div className="relative overflow-hidden" style={{ background: BG, borderTop: `1px solid #ecddd9` }}>
        {/* Content sits on top of the photos */}
        <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-8 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">

            {/* Brand + newsletter — 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Logo */}
              <button
                onClick={() => setView('home')}
                className="flex w-fit items-center gap-2"
                aria-label="Go to Herizone home"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
                >
                  <Heart className="h-4 w-4 text-white" fill="currentColor" />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ color: '#3d2b27' }}>
                  Heri<span style={{ color: C2 }}>zone</span>
                </span>
              </button>

              <p className="max-w-xs text-sm leading-relaxed" style={{ color: '#7a6360' }}>
                A safe, supportive space for every mother — from the first trimester to toddlerhood and beyond.
              </p>

              {/* Newsletter */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#3d2b27' }}>
                  Weekly Newsletter
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-all"
                    style={{
                      borderColor: '#ecddd9',
                      background: 'white',
                      color: '#3d2b27',
                    }}
                  />
                  <button
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
                    style={{ background: C2 }}
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: '#b09490' }}>
                  Tips, stories &amp; expert insights. No spam.
                </p>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-2">
                {SOCIALS.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-all hover:scale-110"
                    style={{ borderColor: '#ecddd9', background: 'white', color: C2 }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {LINKS.map(({ heading, items }) => (
              <div key={heading} className="flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#3d2b27' }}>
                  {heading}
                </p>
                <ul className="flex flex-col gap-2">
                  {items.map(({ label, view, href }) => (
                    <li key={label}>
                      {view ? (
                        <button
                          onClick={() => setView(view)}
                          className="text-sm text-left transition-colors hover:text-[#3d2b27]"
                          style={{ color: '#7a6360' }}
                        >
                          {label}
                        </button>
                      ) : (
                        <a
                          href={href ?? '#'}
                          className="text-sm transition-colors hover:text-[#3d2b27]"
                          style={{ color: '#7a6360' }}
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

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid #ecddd9` }}>
          <div
            className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs lg:flex-row lg:px-10"
            style={{ color: '#b09490' }}
          >
            <p>&copy; {new Date().getFullYear()} Herizone. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="h-3 w-3" style={{ fill: C2, color: C2 }} />
              <span>for every mother</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="transition-colors hover:text-[#3d2b27]">Privacy</a>
              <a href="#" className="transition-colors hover:text-[#3d2b27]">Terms</a>
              <a href="#" className="transition-colors hover:text-[#3d2b27]">Cookies</a>
            </div>
          </div>
        </div>
        </div>{/* end z-10 content wrapper */}

      </div>{/* end main footer body */}

    </footer>
  );
}
