'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import {
  createExpertApplication,
  createExpertQuestion,
  fetchMyExpertPricing,
  fetchMyExpertApplication,
  fetchVerifiedExperts,
  initializeExpertCommunicationPayment,
  initializePremiumPayment,
  refreshSession,
  updateMyExpertPricing,
  verifyPayment,
  type ExpertApplication,
  type ExpertPricing,
  type VerifiedExpert,
} from '@/lib/api';
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
const C1 = '#CAA69B';
const C2 = '#CB978E';
const C3 = '#D4B9B2';
const MAX_EVIDENCE_FILES = 3;
const MAX_EVIDENCE_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image'));
    reader.readAsDataURL(file);
  });
}

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

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {!question.isAnonymous && <AvatarImage src={question.avatar} alt={question.author} />}
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {question.isAnonymous ? <User className="h-4 w-4" /> : question.author.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{question.isAnonymous ? 'Anonymous' : question.author}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(question.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${TOPIC_COLORS[question.topic]}`}>
            {TOPIC_LABELS[question.topic]}
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{question.question}</p>

        <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{questionAnswers.length} expert {questionAnswers.length === 1 ? 'answer' : 'answers'}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-foreground">Expert Answers ({questionAnswers.length})</h3>

        {questionAnswers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No expert answers yet. Check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questionAnswers.map((answer) => (
              <div key={answer.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={answer.expertAvatar} alt={answer.expert} />
                      <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{answer.expert}</p>
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">Verified Expert</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(answer.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">{answer.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AskQuestionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { setQuestions } = useAppStore();
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState<ExpertTopic>('medical');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!questionText.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const createdQuestion = await createExpertQuestion({
        question: questionText.trim(),
        topic,
        isAnonymous,
      });

      const latestQuestions = useAppStore.getState().questions;
      setQuestions([createdQuestion, ...latestQuestions]);

      setQuestionText('');
      setTopic('medical');
      setIsAnonymous(false);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask an Expert</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Questions are answered by verified healthcare professionals within 48 hours. All answers are public.
          </p>
          <Textarea
            placeholder="Write your question here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[120px] resize-none text-sm"
            maxLength={1000}
          />
          <p className="-mt-2 text-right text-xs text-muted-foreground">{questionText.length}/1000</p>

          <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic-select" className="text-sm font-medium">Topic</Label>
              <Select value={topic} onValueChange={(v) => setTopic(v as ExpertTopic)}>
                <SelectTrigger id="topic-select" className="h-8 w-40 text-sm">
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
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplyExpertDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted: (application: ExpertApplication) => void;
}) {
  const [specialty, setSpecialty] = useState('');
  const [credentials, setCredentials] = useState('');
  const [motivation, setMotivation] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!specialty.trim() || !credentials.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const application = await createExpertApplication({
        specialty: specialty.trim(),
        credentials: credentials.trim(),
        motivation: motivation.trim(),
        evidencePhotos,
      });
      onSubmitted(application);
      setSpecialty('');
      setCredentials('');
      setMotivation('');
      setEvidencePhotos([]);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;
    const remainingSlots = MAX_EVIDENCE_FILES - evidencePhotos.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_EVIDENCE_FILES} evidence photos.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed for evidence photos.');
        return;
      }
      if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
        setError('Each evidence photo must be 2MB or smaller.');
        return;
      }
    }

    setError('');
    try {
      const encoded = await Promise.all(acceptedFiles.map((file) => readFileAsDataUrl(file)));
      setEvidencePhotos((prev) => [...prev, ...encoded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to process evidence image');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply as Verified Expert</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Submit your clinical or therapeutic credentials. Admin will review your application.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="expert-specialty">Specialty</Label>
            <Input
              id="expert-specialty"
              placeholder="e.g. Pediatrician, Psychologist, Speech Therapist"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expert-credentials">Credentials</Label>
            <Textarea
              id="expert-credentials"
              placeholder="Licenses, certifications, years of practice, institution"
              className="min-h-[90px] resize-none text-sm"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expert-motivation">Why do you want to join? (optional)</Label>
            <Textarea
              id="expert-motivation"
              placeholder="Short motivation"
              className="min-h-[80px] resize-none text-sm"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expert-evidence">Credential evidence photos (optional, up to 3)</Label>
            <Input
              id="expert-evidence"
              type="file"
              accept="image/*"
              multiple
              onChange={handleEvidenceFileChange}
              disabled={evidencePhotos.length >= MAX_EVIDENCE_FILES}
            />
            <p className="text-xs text-muted-foreground">
              Upload license/certificate photos. Max 2MB each.
            </p>
            {evidencePhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {evidencePhotos.map((photo, index) => (
                  <div key={`${index}-${photo.slice(0, 32)}`} className="relative overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Evidence ${index + 1}`} className="h-20 w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove evidence ${index + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      onClick={() => {
                        setEvidencePhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!specialty.trim() || !credentials.trim() || submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExpertsPage() {
  const {
    currentUser,
    expertFilter,
    expertSearch,
    setExpertFilter,
    setExpertSearch,
    getFilteredQuestions,
    setAuthenticatedUser,
  } = useAppStore();
  const [askOpen, setAskOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [verifiedExperts, setVerifiedExperts] = useState<VerifiedExpert[]>([]);
  const [application, setApplication] = useState<ExpertApplication | null>(null);
  const [myPricing, setMyPricing] = useState<ExpertPricing | null>(null);
  const [priceChat, setPriceChat] = useState('');
  const [priceVoice, setPriceVoice] = useState('');
  const [priceVideo, setPriceVideo] = useState('');
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingSuccess, setPricingSuccess] = useState('');
  const [paymentBusyKey, setPaymentBusyKey] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [premiumBusy, setPremiumBusy] = useState(false);

  const filteredQuestions = getFilteredQuestions();
  const premiumActive = Boolean(
    currentUser.isPremium &&
      currentUser.premiumUntil &&
      currentUser.premiumUntil.getTime() > Date.now()
  );

  useEffect(() => {
    let active = true;

    async function loadExpertMeta() {
      try {
        const experts = await fetchVerifiedExperts();
        if (active) setVerifiedExperts(experts);
      } catch (_error) {
        // Keep page functional even when this optional request fails.
      }

      if (currentUser.isExpert) {
        try {
          const pricing = await fetchMyExpertPricing();
          if (active) {
            setMyPricing(pricing);
            setPriceChat(pricing.chat == null ? '' : String(pricing.chat));
            setPriceVoice(pricing.voice == null ? '' : String(pricing.voice));
            setPriceVideo(pricing.video == null ? '' : String(pricing.video));
          }
        } catch (_error) {
          // Ignore to keep page functional.
        }
      } else {
        try {
          const myApplication = await fetchMyExpertApplication();
          if (active) setApplication(myApplication);
        } catch (_error) {
          // Ignore if no session edge-case or temporary failure.
        }
      }
    }

    loadExpertMeta();
    return () => {
      active = false;
    };
  }, [currentUser.isExpert]);

  const savePricing = async () => {
    const chat = Number(priceChat);
    const voice = Number(priceVoice);
    const video = Number(priceVideo);

    if (
      !priceChat.trim() ||
      !priceVoice.trim() ||
      !priceVideo.trim() ||
      Number.isNaN(chat) ||
      Number.isNaN(voice) ||
      Number.isNaN(video) ||
      chat < 0 ||
      voice < 0 ||
      video < 0
    ) {
      setPricingError('Please enter valid non-negative prices for chat, voice, and video.');
      setPricingSuccess('');
      return;
    }

    setPricingSaving(true);
    setPricingError('');
    setPricingSuccess('');
    try {
      const saved = await updateMyExpertPricing({ chat, voice, video });
      setMyPricing(saved);
      setPricingSuccess('Pricing updated.');
      const experts = await fetchVerifiedExperts();
      setVerifiedExperts(experts);
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Failed to save pricing');
    } finally {
      setPricingSaving(false);
    }
  };

  const askPhoneNumber = () => {
    const input = window.prompt('Enter your M-Pesa Safaricom number (2517XXXXXXXX or 07XXXXXXXX):', '');
    if (!input) return '';
    return input.trim();
  };

  const pollPaymentStatus = async (txRef: string) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      try {
        const verification = await verifyPayment(txRef);
        if (verification.status === 'success') {
          const user = await refreshSession();
          setAuthenticatedUser(user);
          setPaymentError('Payment successful. Premium/consultation access updated.');
          return;
        }
      } catch (_error) {
        // Keep polling for a short time to allow asynchronous provider callback.
      }
    }
  };

  const startExpertCommunicationPayment = async (
    expertId: string,
    mode: 'chat' | 'voice' | 'video'
  ) => {
    const key = `${expertId}-${mode}`;
    const phoneNumber = askPhoneNumber();
    if (!phoneNumber) {
      return;
    }
    setPaymentBusyKey(key);
    setPaymentError('');
    try {
      const payment = await initializeExpertCommunicationPayment({ expertId, mode, phoneNumber });
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      setPaymentError(payment.customerMessage || 'M-Pesa prompt sent. Complete PIN on your phone.');
      void pollPaymentStatus(payment.txRef);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to initialize payment');
      setPaymentBusyKey('');
      return;
    }
    setPaymentBusyKey('');
  };

  const startPremiumPayment = async () => {
    const phoneNumber = askPhoneNumber();
    if (!phoneNumber) {
      return;
    }
    setPremiumBusy(true);
    setPaymentError('');
    try {
      const payment = await initializePremiumPayment({ phoneNumber });
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      setPaymentError(payment.customerMessage || 'M-Pesa prompt sent. Complete PIN on your phone.');
      void pollPaymentStatus(payment.txRef);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to initialize premium payment');
      setPremiumBusy(false);
      return;
    }
    setPremiumBusy(false);
  };

  if (selectedQuestionId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <QuestionDetail questionId={selectedQuestionId} onBack={() => setSelectedQuestionId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #f9ede9 0%, #f5e6e2 50%, #eeddd9 100%)',
          borderColor: '#ecddd9',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: C2 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C2 }}>
                Ask Experts
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Professional Guidance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Questions answered by verified healthcare professionals.
            </p>
          </div>
          <div className="flex gap-2">
            {!currentUser.isExpert && (
              <Button
                variant="outline"
                onClick={() => setApplyOpen(true)}
                className="shrink-0 border-[#d4b9b2] bg-white/70 text-[#cb978e] hover:bg-white"
              >
                Apply as Expert
              </Button>
            )}
            <Button
              onClick={() => setAskOpen(true)}
              className="shrink-0 gap-1.5 text-white"
              style={{ background: C2 }}
            >
              <Plus className="h-4 w-4" />
              Ask a Question
            </Button>
          </div>
        </div>
      </div>

      {!currentUser.isExpert && (
        <div className="mb-4 rounded-xl border bg-white p-4" style={{ borderColor: '#ecddd9' }}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expert application status</p>
          <p className="mt-1 text-sm text-foreground">
            {!application && 'No application submitted yet.'}
            {application?.status === 'pending' && 'Pending review by admin.'}
            {application?.status === 'approved' && 'Approved. You are now a verified expert.'}
            {application?.status === 'rejected' && 'Rejected. You can submit a new application.'}
          </p>
          {application?.reviewedNote && (
            <p className="mt-1 text-xs text-muted-foreground">Admin note: {application.reviewedNote}</p>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#ecddd9' }}>
        <div className="mb-2 flex w-full items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: C2 }}>Our verified experts</p>
            <p className="mt-1 text-xs text-gray-500">
              {premiumActive
                ? 'Premium discount is active on expert communication payments.'
                : 'Upgrade to premium to get a discount on expert communication payments.'}
            </p>
          </div>
          {!currentUser.isExpert && (
            <Button size="sm" onClick={() => void startPremiumPayment()} disabled={premiumBusy} style={{ background: C2 }}>
              {premiumBusy ? 'Processing...' : premiumActive ? 'Extend Premium' : 'Go Premium'}
            </Button>
          )}
        </div>
        {verifiedExperts.length === 0 && (
          <p className="text-xs text-gray-500">No verified experts listed yet.</p>
        )}
        {verifiedExperts.map((expert) => (
          <div key={expert.id} className="w-full rounded-xl border p-3 text-xs" style={{ borderColor: '#ecddd9', background: '#fffafb' }}>
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: C2 }} />
              <span className="font-medium">
                {expert.name}
                {expert.specialty ? ` — ${expert.specialty}` : ''}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4b9b2] text-[#cb978e] hover:bg-white"
                disabled={expert.id === currentUser.id || expert.pricing.chat == null || paymentBusyKey === `${expert.id}-chat`}
                onClick={() => void startExpertCommunicationPayment(expert.id, 'chat')}
              >
                {paymentBusyKey === `${expert.id}-chat`
                  ? 'Processing...'
                  : `Chat $${expert.pricing.chat ?? 'N/A'}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4b9b2] text-[#cb978e] hover:bg-white"
                disabled={expert.id === currentUser.id || expert.pricing.voice == null || paymentBusyKey === `${expert.id}-voice`}
                onClick={() => void startExpertCommunicationPayment(expert.id, 'voice')}
              >
                {paymentBusyKey === `${expert.id}-voice`
                  ? 'Processing...'
                  : `Voice $${expert.pricing.voice ?? 'N/A'}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4b9b2] text-[#cb978e] hover:bg-white"
                disabled={expert.id === currentUser.id || expert.pricing.video == null || paymentBusyKey === `${expert.id}-video`}
                onClick={() => void startExpertCommunicationPayment(expert.id, 'video')}
              >
                {paymentBusyKey === `${expert.id}-video`
                  ? 'Processing...'
                  : `Video $${expert.pricing.video ?? 'N/A'}`}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {paymentError && <p className="-mt-3 mb-5 text-xs text-destructive">{paymentError}</p>}

      {currentUser.isExpert && (
        <div className="mb-6 rounded-xl border bg-white p-4" style={{ borderColor: '#ecddd9' }}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your consultation pricing</p>
          <p className="mt-1 text-xs text-muted-foreground">Set your own price after admin approval.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Input type="number" min="0" step="0.01" placeholder="Chat $" value={priceChat} onChange={(e) => setPriceChat(e.target.value)} />
            <Input type="number" min="0" step="0.01" placeholder="Voice $" value={priceVoice} onChange={(e) => setPriceVoice(e.target.value)} />
            <Input type="number" min="0" step="0.01" placeholder="Video $" value={priceVideo} onChange={(e) => setPriceVideo(e.target.value)} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => void savePricing()} disabled={pricingSaving}>
              {pricingSaving ? 'Saving...' : 'Save Pricing'}
            </Button>
            {myPricing && (
              <span className="text-xs text-muted-foreground">
                Current: chat ${myPricing.chat ?? 0} / voice ${myPricing.voice ?? 0} / video ${myPricing.video ?? 0}
              </span>
            )}
          </div>
          {pricingError && <p className="mt-2 text-xs text-destructive">{pricingError}</p>}
          {pricingSuccess && <p className="mt-2 text-xs text-primary">{pricingSuccess}</p>}
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={expertSearch}
          onChange={(e) => setExpertSearch(e.target.value)}
          className="h-10 rounded-xl border-[#ecddd9] bg-white pl-9 text-sm"
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

      <div className="mb-6 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.value}
            onClick={() => setExpertFilter(t.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              expertFilter === t.value
                ? 'border-[#cb978e] bg-[#cb978e] text-white'
                : 'border-[#ecddd9] bg-white text-gray-500 hover:border-[#cb978e]/40 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
              className="cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: '#ecddd9' }}
              onClick={() => setSelectedQuestionId(q.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedQuestionId(q.id)}
              role="button"
              aria-label={`View question from ${q.isAnonymous ? 'Anonymous' : q.author}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    {!q.isAnonymous && <AvatarImage src={q.avatar} alt={q.author} />}
                    <AvatarFallback className="bg-muted text-xs">
                      {q.isAnonymous ? <User className="h-3.5 w-3.5" /> : q.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium text-foreground">{q.isAnonymous ? 'Anonymous' : q.author}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(q.timestamp, { addSuffix: true })}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`shrink-0 text-xs ${TOPIC_COLORS[q.topic]}`}>
                  {TOPIC_LABELS[q.topic]}
                </Badge>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">{q.question}</p>

              <div className="mt-3 flex items-center gap-1.5 text-xs">
                {q.answerCount > 0 ? (
                  <span className="flex items-center gap-1 font-medium" style={{ color: C2 }}>
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
      <ApplyExpertDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onSubmitted={(created) => setApplication(created)}
      />
    </div>
  );
}
