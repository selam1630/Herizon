'use client';

import { useState } from 'react';
import { useAppStore, type ExpertTopic } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  User,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
      authorId: currentUser.id,
      author: currentUser.name,
      avatar: currentUser.avatar,
      question: questionText.trim(),
      topic,
      isAnonymous,
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
  const { expertFilter, expertSearch, setExpertFilter, setExpertSearch, getFilteredQuestions } =
    useAppStore();
  const [askOpen, setAskOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

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

      {/* Expert badges */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
        <div className="w-full mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Our verified experts</p>
        </div>
        {['Dr. Amara Osei — OB/GYN', 'Dr. Rachel Coleman — Psychologist', 'Dr. Lisa Park — Nutritionist', 'Maria Santos — IBCLC'].map((name) => (
          <div key={name} className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
            <span className="text-foreground">{name}</span>
          </div>
        ))}
      </div>

      {/* Search */}
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
