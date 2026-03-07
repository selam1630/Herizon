'use client';

import { useAppStore, type View } from '@/lib/store';
import {
    ArrowRight,
    BookOpen,
    Heart,
    MessageSquare,
    Shield,
    Sparkles,
    Stethoscope,
    Users,
} from 'lucide-react';

// ── Brand palette ─────────────────────────────────────────────────────────────
const C1 = '#CAA69B'; // warm rose-tan
const C2 = '#CB978E'; // deep blush
const C3 = '#D4B9B2'; // soft blush-pink

const features = [
  {
    icon: Users,
    title: 'Community Forum',
    description:
      'Connect with thousands of mothers navigating the same joys and challenges. Share, ask, and support each other anonymously or openly.',
    view: 'feed' as const,
    cta: 'Join the conversation',
  },
  {
    icon: BookOpen,
    title: 'Educational Library',
    description:
      'Evidence-based articles written by verified healthcare professionals on pregnancy, parenting, nutrition, and mental health.',
    view: 'learn' as const,
    cta: 'Browse articles',
  },
  {
    icon: MessageSquare,
    title: 'Expert Q&A',
    description:
      'Get personalized answers from verified OBs, pediatricians, lactation consultants, and child psychologists.',
    view: 'experts' as const,
    cta: 'Ask an expert',
  },
  {
    icon: Sparkles,
    title: 'AI Support',
    description:
      'Available 24/7, our AI assistant answers your questions instantly and connects you with relevant resources.',
    action: 'chat' as const,
    cta: 'Start chatting',
  },
];

const stats = [
  { value: '12,400', suffix: '+', label: 'Mothers\nConnected' },
  { value: '340', suffix: '+', label: 'Expert\nAnswers' },
  { value: '98', suffix: '+', label: 'Curated\nArticles' },
  { value: '24/7', suffix: '', label: 'AI\nSupport' },
];

export function HomePage() {
  const { setView, setChatOpen } = useAppStore();

  return (
    <main className="flex-1 font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f9ede9 0%, #f5e6e2 50%, #eeddd9 100%)' }}
      >
        {/* decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full opacity-20"
          style={{ background: C2 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full opacity-10"
          style={{ background: C1 }}
        />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center lg:grid-cols-2">

          {/* Left — stacked pill photo frames (inspired by reference) */}
          <div className="relative flex items-center justify-center py-20 lg:py-0 lg:min-h-[720px]">

            {/* large blush oval behind everything */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[480px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-[60%_40%_50%_50%/55%_45%_55%_45%] opacity-40"
              style={{ background: `radial-gradient(ellipse, ${C3} 0%, transparent 80%)` }}
            />

            {/* ── Photo card 1 — top-left (slightly rotated) ── */}
            <div
              className="absolute left-[10%] top-[5%] z-10 overflow-hidden shadow-xl"
              style={{
                width: 210,
                height: 285,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                border: `4px solid white`,
                transform: 'rotate(-6deg)',
                boxShadow: '0 16px 40px rgba(203,151,142,0.25)',
              }}
            >
              <img
                src="/hero-1.png"
                alt="Pregnant mother in yellow hijab holding ultrasound"
                className="h-full w-full object-cover object-top"
              />
              {/* label chip on card 1 */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold text-white shadow"
                style={{ background: C2, opacity: 0.92 }}
              >
                Pregnancy Journey
              </div>
            </div>

            {/* ── Photo card 2 — center-right (upright, slightly larger) ── */}
            <div
              className="relative z-20 overflow-hidden shadow-2xl"
              style={{
                width: 230,
                height: 310,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                border: `4px solid white`,
                marginLeft: 60,
                marginTop: 40,
                boxShadow: '0 20px 50px rgba(203,151,142,0.30)',
              }}
            >
              <img
                src="/hero-2.png"
                alt="Mother holding smiling newborn"
                className="h-full w-full object-cover object-top"
              />
              {/* label chip on card 2 */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold text-white shadow"
                style={{ background: C1, opacity: 0.92 }}
              >
                New Motherhood
              </div>
            </div>

            {/* ── Photo card 3 — bottom-left (small, rotated other way) ── */}
            <div
              className="absolute bottom-[6%] left-[8%] z-10 overflow-hidden shadow-lg"
              style={{
                width: 175,
                height: 235,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                border: `4px solid white`,
                transform: 'rotate(5deg)',
                boxShadow: '0 12px 30px rgba(212,185,178,0.35)',
              }}
            >
              <img
                src="/hero-3.png"
                alt="Mother cradling newborn baby"
                className="h-full w-full object-cover object-top"
              />
              {/* label chip on card 3 */}
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[9px] font-semibold text-white shadow"
                style={{ background: C2, opacity: 0.88 }}
              >
                Community
              </div>
            </div>

            {/* floating members badge */}
            <div
              className="absolute right-[4%] top-[18%] z-30 flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/85 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
            >
              <div className="flex -space-x-1.5">
                {[
                  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=28&h=28&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=28&h=28&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=28&h=28&fit=crop&crop=faces',
                ].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-6 w-6 rounded-full border-2 border-white object-cover" crossOrigin="anonymous" />
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">12,400+</p>
                <p className="text-[10px] text-gray-400">active moms</p>
              </div>
            </div>

            {/* floating AI chip */}
            <div
              className="absolute bottom-[22%] right-[3%] z-30 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 shadow-md backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3" style={{ color: C2 }} />
              <span className="text-[11px] font-medium text-gray-700">AI Support 24/7</span>
            </div>
          </div>

          {/* Right — copy */}
          <div className="flex flex-col justify-center px-8 py-16 sm:px-12 lg:py-24 lg:pl-14 xl:pl-20">
            {/* eyebrow */}
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: C2 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C2 }}>
                Herizone Community
              </span>
            </div>

            {/* headline */}
            <h1 className="text-balance text-[2.8rem] font-extrabold leading-[1.08] tracking-tight text-gray-800 sm:text-5xl lg:text-[3.4rem]">
              You don&apos;t have
              <br />
              to navigate{' '}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: C2 }}>
                  motherhood
                </span>
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M1 5.5 C 40 1, 100 1, 199 5.5" stroke={C3} strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              alone.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-gray-500">
              Herizone connects mothers with a supportive community, trusted educational resources, verified healthcare experts, and an AI assistant — at every stage of the journey.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => setView('feed')}
                className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                style={{ background: C2 }}
              >
                Join the Community
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('learn')}
                className="flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white/60"
                style={{ borderColor: C1, color: C2 }}
              >
                <BookOpen className="h-4 w-4" />
                Browse Resources
              </button>
            </div>

            {/* trust badges */}
            <div className="mt-10 flex flex-wrap gap-5">
              {[
                { icon: Shield, text: 'Anonymous posting' },
                { icon: Heart, text: 'Moderated safe space' },
                { icon: Sparkles, text: 'Expert replies in 48h' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: C1 }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section
        className="border-y px-4 py-16 sm:px-6 lg:px-8"
        style={{ borderColor: '#ecddd9', background: '#fdf6f4' }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:gap-y-0" style={{ '--tw-divide-color': '#ecddd9' } as React.CSSProperties}>
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col items-center px-4 py-3">
                <span className="text-5xl font-black leading-none tracking-tight sm:text-6xl" style={{ color: C3 }}>
                  {value}
                  <span className="text-3xl font-bold" style={{ color: C2 }}>{suffix}</span>
                </span>
                <span className="mt-2 whitespace-pre-line text-center text-xs leading-relaxed text-gray-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE HERIZONE EXPERIENCE ───────────────────────────────────── */}
      <section className="px-4 py-28 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-6xl">
          {/* section header */}
          <div className="mb-20 grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <h2 className="text-4xl font-black leading-tight tracking-tight text-gray-800 sm:text-5xl">
                The Herizone
                <br />
                <span className="font-light italic" style={{ color: C1 }}>
                  Experience
                </span>
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="text-sm leading-relaxed text-gray-400">
                Our suite of community, expert, and AI-powered tools makes navigating motherhood easy and accessible — from first trimester to toddler years and beyond.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Every feature is built with your safety, privacy, and wellbeing in mind. Join thousands of women who trust Herizone every day.
              </p>
            </div>
          </div>

          {/* feature cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isHighlighted = idx === 0;
              const handleClick = () => {
                if ('view' in feature && feature.view) setView(feature.view as View);
                else setChatOpen(true);
              };

              return (
                <button
                  key={feature.title}
                  onClick={handleClick}
                  className="group flex flex-col gap-4 rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={
                    isHighlighted
                      ? { background: `linear-gradient(145deg, ${C3}, ${C2})`, color: 'white' }
                      : { background: '#fdf6f4', border: `1px solid #ecddd9` }
                  }
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={
                      isHighlighted
                        ? { background: 'rgba(255,255,255,0.25)' }
                        : { background: '#fff', border: `1px solid ${C3}` }
                    }
                  >
                    <Icon className="h-5 w-5" style={{ color: isHighlighted ? 'white' : C2 }} strokeWidth={1.5} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: isHighlighted ? 'white' : C2 }}>
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: isHighlighted ? 'rgba(255,255,255,0.8)' : '#999' }}>
                      {feature.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: isHighlighted ? 'white' : C2 }}>
                    {feature.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      {/* <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{ background: `linear-gradient(135deg, ${C2} 0%, ${C1} 100%)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div>
            <h2 className="text-balance text-2xl font-bold text-white sm:text-3xl">
              Start your journey with Herizone today
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">
              Join a community that truly understands what you&apos;re going through. No judgment, only support.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setView('feed')}
              className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
              style={{ color: C2 }}
            >
              <Users className="h-4 w-4" />
              Explore Community
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15"
            >
              <Sparkles className="h-4 w-4" />
              Try AI Support
            </button>
          </div>
        </div>
      </section> */}

      {/* ── JOIN AS EXPERT BANNER ─────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(135deg, #f9ede9 0%, #f0e8f5 50%, #e8f4f0 100%)' }}
      >
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-20" style={{ background: C2 }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full opacity-15" style={{ background: C1 }} />

        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-sm shadow-xl px-8 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
            {/* Left */}
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ecddd9] bg-white px-3.5 py-1.5 text-xs font-semibold" style={{ color: C2 }}>
                <Stethoscope className="h-3.5 w-3.5" />
                Expert Contributors
              </div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-800 sm:text-4xl">
                Are you a healthcare
                <br />
                <span style={{ color: C2 }}>professional?</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500">
                Join Herizone as a verified expert — write evidence-based articles, answer community questions, and make a real impact on mothers' health journeys. OBs, midwives, pediatricians, nutritionists, and mental health professionals welcome.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                {[
                  { icon: BookOpen, text: 'Publish expert articles' },
                  { icon: MessageSquare, text: 'Answer Q&A questions' },
                  { icon: Shield, text: 'Verified expert badge' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: C1 }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="mt-8 flex shrink-0 flex-col items-center gap-4 lg:mt-0 lg:items-start">
              <a
                href="/join-as-expert"
                className="flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${C2}, ${C1})` }}
              >
                <Stethoscope className="h-4 w-4" />
                Join as Expert
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-gray-400 text-center lg:text-left">
                Applications reviewed within 48 hours
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
