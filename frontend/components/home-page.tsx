'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Heart,
  Shield,
  Clock,
  Star,
  Lock,
  Eye,
} from 'lucide-react';

// ─── Curated Unsplash photos of mothers / pregnancy ──────────────────────────
const HERO_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=faces',
    alt: 'Mother smiling warmly',
    className: 'row-span-2 h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=240&fit=crop&crop=faces',
    alt: 'Pregnant woman relaxing',
    className: 'h-[160px]',
  },
  {
    src: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=400&h=240&fit=crop&crop=faces',
    alt: 'Mother and newborn',
    className: 'h-[160px]',
  },
  {
    src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=240&fit=crop&crop=faces',
    alt: 'Women supporting each other',
    className: 'h-[160px]',
  },
  {
    src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&h=240&fit=crop&crop=faces',
    alt: 'Happy mother with child',
    className: 'h-[160px]',
  },
];

const features = [
  {
    icon: Users,
    title: 'Community Forum',
    description:
      'Connect with thousands of mothers navigating the same joys and challenges. Share, ask, and support each other anonymously or openly.',
    view: 'feed' as const,
    cta: 'Join the conversation',
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    icon: BookOpen,
    title: 'Educational Library',
    description:
      'Evidence-based articles written by verified healthcare professionals on pregnancy, parenting, nutrition, and mental health.',
    view: 'learn' as const,
    cta: 'Browse articles',
    accent: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  {
    icon: MessageSquare,
    title: 'Expert Q&A',
    description:
      'Get personalized answers from verified OBs, pediatricians, lactation consultants, and child psychologists.',
    view: 'experts' as const,
    cta: 'Ask an expert',
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    icon: Sparkles,
    title: 'AI Support',
    description:
      'Available 24/7, our AI assistant answers your questions instantly and connects you with relevant resources.',
    action: 'chat' as const,
    cta: 'Start chatting',
    accent: 'bg-teal-50 text-teal-600 border-teal-100',
  },
];

const stats = [
  { value: '12,400+', label: 'Mothers connected' },
  { value: '340+', label: 'Expert answers' },
  { value: '98+', label: 'Curated articles' },
  { value: '24/7', label: 'AI support' },
];

// ─── Floating Social Proof Card ───────────────────────────────────────────────
function FloatingCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute z-20 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function HomePage({ onGetStarted }: { onGetStarted?: () => void }) {
  const { setView, setChatOpen } = useAppStore();
  const shouldShowAuth = typeof onGetStarted === 'function';

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }

    setView('feed');
  };

  return (
    <main className="flex-1 font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-0 lg:grid-cols-2">

          {/* Left — Copy */}
          <div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-10 lg:py-24 lg:pr-12 xl:pl-16">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Herizon Community
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-balance text-[2.6rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.2rem]">
              You don&apos;t have
              <br />
              to navigate{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">motherhood</span>
                {/* underline accent */}
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1 5.5 C 40 1, 100 1, 199 5.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-primary/30"
                  />
                </svg>
              </span>
              <br />
              alone.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Herizon connects mothers with a supportive community, trusted educational resources, verified healthcare experts, and an AI assistant — at every stage of the journey.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 rounded-full px-7 font-semibold"
              >
                {shouldShowAuth ? 'Get Started' : 'Join the Community'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView('learn')}
                className="gap-2 rounded-full px-7"
              >
                <BookOpen className="h-4 w-4" />
                Browse Resources
              </Button>
            </div>

            {/* Trust row */}
            <div className="mt-10 flex flex-wrap gap-5">
              {[
                { icon: Shield, text: 'Anonymous posting' },
                { icon: Heart, text: 'Moderated safe space' },
                { icon: Clock, text: 'Expert replies in 48h' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Photo collage */}
          <div className="relative hidden h-full min-h-[600px] overflow-hidden bg-muted/30 lg:block">

            {/* Subtle tinted overlay on the whole panel */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-transparent to-background/10" />

            {/* 2 × 2 staggered grid of photos */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-6">
              {/* Top-left tall */}
              <div className="row-span-2 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=700&fit=crop&crop=faces"
                  alt="Mother smiling warmly"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Top-right — offset downward */}
              <div className="mt-10 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=500&h=340&fit=crop&crop=faces"
                  alt="Mother and newborn bonding"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Bottom-right — offset upward */}
              <div className="-mt-10 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=500&h=340&fit=crop&crop=faces"
                  alt="Happy mother with child"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* ── Floating cards ─────────────────────────────────────────── */}

            {/* Members online pill — top */}
            <FloatingCard className="left-4 top-6 flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=40&h=40&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=faces',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-card object-cover"
                    crossOrigin="anonymous"
                  />
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">12,400+ moms</p>
                <p className="text-[10px] text-muted-foreground">active community</p>
              </div>
            </FloatingCard>

            {/* Expert answer card — middle right */}
            <FloatingCard className="bottom-28 right-3 w-52">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Expert answered</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    "Prenatal yoga is safe from week 12. Start with supported poses..."
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </FloatingCard>

            {/* AI chat bubble — bottom left */}
            <FloatingCard className="bottom-8 left-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">AI Support</p>
                <p className="text-[10px] text-muted-foreground">Available 24/7 for you</p>
              </div>
            </FloatingCard>
          </div>

        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
            {stats.map(({ value, label }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center px-4 py-2 ${i > 0 ? '' : ''}`}
              >
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {value}
                </span>
                <span className="mt-0.5 text-center text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCESS GUIDE ─────────────────────────────────────────────────── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Visible Without Login</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Landing page and platform overview</li>
                <li>Feature highlights and how support works</li>
                <li>General public information</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Requires Sign In</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Community posts, comments, and anonymous posting</li>
                <li>Asking questions to verified experts</li>
                <li>Personalized dashboard, saved resources, and AI support history</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              What we offer
            </p>
            <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Everything you need, in one place
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Built specifically for pregnant women and mothers at every stage of the journey.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const handleClick = () => {
                if (shouldShowAuth) {
                  handleGetStarted();
                  return;
                }

                if ('view' in feature && feature.view) setView(feature.view);
                else setChatOpen(true);
              };

              return (
                <Card
                  key={feature.title}
                  className="group cursor-pointer border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  onClick={handleClick}
                >
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${feature.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                      {feature.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL STRIP ────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                quote: "I found my people here. The community support during my third trimester was invaluable.",
                name: "Amara K.",
                role: "Mom of 1 · 28 weeks",
                src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=faces",
              },
              {
                quote: "The expert Q&A saved me so many unnecessary doctor calls. Answers are thoughtful and fast.",
                name: "Sofia R.",
                role: "Mom of 2",
                src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=faces",
              },
              {
                quote: "Being able to post anonymously made it safe to ask the questions I was afraid to ask anyone.",
                name: "Anonymous",
                role: "New mom · 6 weeks postpartum",
                src: "",
              },
            ].map(({ quote, name, role, src }) => (
              <div key={name} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  {src ? (
                    <img
                      src={src}
                      alt={name}
                      className="h-8 w-8 rounded-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      A
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-foreground">{name}</p>
                    <p className="text-[11px] text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-4 py-16 sm:px-6 lg:px-8">
        {/* faint pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-center lg:text-left">
            <h2 className="text-balance text-2xl font-bold text-primary-foreground sm:text-3xl">
              Start your journey with Herizon today
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              Join a community that truly understands what you&apos;re going through. No judgment, only support.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2 rounded-full bg-card px-7 text-foreground hover:bg-card/90"
            >
              <Users className="h-4 w-4" />
              {shouldShowAuth ? 'Get Started' : 'Explore Community'}
            </Button>
            <Button
              size="lg"
              onClick={() => setChatOpen(true)}
              variant="ghost"
              className="gap-2 rounded-full border border-primary-foreground/30 px-7 text-primary-foreground hover:bg-primary-foreground/15"
            >
              <Sparkles className="h-4 w-4" />
              Try AI Support
            </Button>
          </div>
        </div>
      </section>

    </main>
  );
}
