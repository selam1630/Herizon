'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore, type Expert, type ExpertTopic } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import {
    BadgeCheck,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronLeft,
    DollarSign,
    MessageSquare,
    Plus,
    Search,
    Stethoscope,
    User,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────

const TOPICS: { value: ExpertTopic | 'all'; label: string }[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'medical', label: 'Medical' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'parenting', label: 'Parenting' },
];

const TOPIC_COLORS: Record<ExpertTopic, string> = {
  medical: 'bg-blue-100 text-blue-700 border-blue-200',
  mental_health: 'bg-purple-100 text-purple-700 border-purple-200',
  nutrition: 'bg-green-100 text-green-700 border-green-200',
  parenting: 'bg-orange-100 text-orange-700 border-orange-200',
};

const TOPIC_LABELS: Record<ExpertTopic, string> = {
  medical: 'Medical',
  mental_health: 'Mental Health',
  nutrition: 'Nutrition',
  parenting: 'Parenting',
};

// ─── Expert Card ─────────────────────────────────────────────────────────────

const C2 = '#CB978E';
const C1 = '#CAA69B';
const C3 = '#D4B9B2';

function ExpertCard({ expert }: { expert: Expert }) {
  const initials = expert.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14">
            <AvatarImage src={expert.avatar} alt={expert.name} />
            <AvatarFallback
              className="text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: C2 }}
            title="Verified Expert"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-tight">{expert.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Stethoscope className="h-3.5 w-3.5 shrink-0" style={{ color: C2 }} />
            <span className="text-xs text-muted-foreground truncate">{expert.specialty}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" style={{ color: C1 }} />
            <span className="text-xs text-muted-foreground">{expert.yearsOfExperience} yrs experience</span>
          </div>
        </div>
      </div>

      {expert.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{expert.bio}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
        <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: C2 }}>
          <DollarSign className="h-4 w-4" />
          {expert.priceMin === expert.priceMax
            ? `$${expert.priceMin}/hr`
            : `$${expert.priceMin} – $${expert.priceMax}/hr`}
        </div>
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: `${C2}60`, color: C2 }}
        >
          Verified Expert
        </Badge>
      </div>
    </div>
  );
}

// ─── Question Detail ──────────────────────────────────────────────────────────

function QuestionDetail({ questionId, onBack }: { questionId: string; onBack: () => void }) {
  const { questions, answers } = useAppStore();
  const question = questions.find((q) => q.id === questionId);
  const questionAnswers = answers[questionId] || [];

  if (!question) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to questions
      </button>

      {/* Question */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {!question.isAnonymous && (
                <AvatarImage src={question.avatar} alt={question.author} />
              )}
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {question.isAnonymous ? (
                  <User className="h-4 w-4" />
                ) : (
                  question.author.slice(0, 2).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {question.isAnonymous ? 'Anonymous' : question.author}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(question.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${TOPIC_COLORS[question.topic]}`}
          >
            {TOPIC_LABELS[question.topic]}
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{question.question}</p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-4">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{questionAnswers.length} expert {questionAnswers.length === 1 ? 'answer' : 'answers'}</span>
        </div>
      </div>

      {/* Answers */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-foreground">
          Expert Answers ({questionAnswers.length})
        </h3>

        {questionAnswers.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No expert answers yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questionAnswers.map((answer) => (
              <div
                key={answer.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={answer.expertAvatar} alt={answer.expert} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {answer.expert.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                      aria-label="Verified expert"
                    >
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{answer.expert}</p>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Verified Expert
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(answer.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  {answer.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ask Question Dialog ──────────────────────────────────────────────────────

function AskQuestionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addQuestion, currentUser } = useAppStore();
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState<ExpertTopic>('medical');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!questionText.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    addQuestion({
      question: questionText.trim(),
      topic,
    });
    setQuestionText('');
    setTopic('medical');
    setIsAnonymous(false);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask an Expert</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Questions are answered by verified healthcare professionals within 48 hours. All answers are public.
          </p>
          <Textarea
            placeholder="Write your question here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[120px] resize-none text-sm"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right -mt-2">{questionText.length}/1000</p>

          <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic-select" className="text-sm font-medium">Topic</Label>
              <Select value={topic} onValueChange={(v) => setTopic(v as ExpertTopic)}>
                <SelectTrigger id="topic-select" className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.filter((t) => t.value !== 'all').map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="expert-anon" className="text-sm font-medium">Ask anonymously</Label>
              <Switch id="expert-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!questionText.trim() || submitting}>
              {submitting ? 'Submitting...' : 'Submit Question'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ExpertsPage() {
  const {
    expertFilter, expertSearch, setExpertFilter, setExpertSearch, getFilteredQuestions,
    experts, expertsLoading, fetchExperts,
  } = useAppStore();
  const [askOpen, setAskOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const filteredQuestions = getFilteredQuestions();

  if (selectedQuestionId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <QuestionDetail
          questionId={selectedQuestionId}
          onBack={() => setSelectedQuestionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ask Experts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Questions answered by verified healthcare professionals.
          </p>
        </div>
        <Button onClick={() => setAskOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" />
          Ask a Question
        </Button>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Our Verified Experts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Browse experts and their consultation rates</p>
          </div>
          <Link
            href="/join-as-expert"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-105"
            style={{ background: `linear-gradient(135deg, ${C3}, ${C2})` }}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Join as Expert
          </Link>
        </div>

        {expertsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No verified experts yet.</p>
            <Link
              href="/join-as-expert"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: C2 }}
            >
              Be the first to apply <BadgeCheck className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-8" />
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={expertSearch}
          onChange={(e) => setExpertSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {expertSearch && (
          <button
            onClick={() => setExpertSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Topic pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.value}
            onClick={() => setExpertFilter(t.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              expertFilter === t.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {filteredQuestions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">No questions found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {expertSearch ? 'Try a different search term.' : 'Be the first to ask our experts.'}
            </p>
            <Button onClick={() => setAskOpen(true)} className="mt-4 gap-1.5" variant="outline">
              <Plus className="h-4 w-4" />
              Ask a Question
            </Button>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <article
              key={q.id}
              className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
              onClick={() => setSelectedQuestionId(q.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedQuestionId(q.id)}
              role="button"
              aria-label={`View question from ${q.isAnonymous ? 'Anonymous' : q.author}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    {!q.isAnonymous && <AvatarImage src={q.avatar} alt={q.author} />}
                    <AvatarFallback className="bg-muted text-xs">
                      {q.isAnonymous ? <User className="h-3.5 w-3.5" /> : q.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {q.isAnonymous ? 'Anonymous' : q.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(q.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${TOPIC_COLORS[q.topic]}`}
                >
                  {TOPIC_LABELS[q.topic]}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-2">{q.question}</p>

              <div className="mt-3 flex items-center gap-1.5 text-xs">
                {q.answerCount > 0 ? (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {q.answerCount} expert {q.answerCount === 1 ? 'answer' : 'answers'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Awaiting expert response
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <AskQuestionDialog open={askOpen} onOpenChange={setAskOpen} />
    </div>
  );
}
