'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    BookOpen,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Loader2,
    Shield,
    Stethoscope,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const C2 = '#CB978E';
const C1 = '#CAA69B';
const C3 = '#D4B9B2';

const STEP_LABELS = ['Your Practice', 'Experience & Pricing', 'About You', 'Legal'];

export default function JoinAsExpertPage() {
  const { currentUser, isAuthenticated, myExpertApplication, fetchMyApplication, applyAsExpert } =
    useAppStore();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    specialty: '',
    yearsOfExperience: '',
    licenseNumber: '',
    priceMin: '',
    priceMax: '',
    credentials: '',
    bio: '',
    agreeToTerms: false,
    agreeAccuracy: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchMyApplication();
  }, [isAuthenticated, fetchMyApplication]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-amber-100 p-5 mb-4">
          <Stethoscope className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Sign in to Apply</h2>
        <p className="mt-2 text-sm text-gray-500">Please log in to submit your expert application.</p>
        <a href="/" className="mt-5 flex items-center gap-1.5 text-sm font-medium" style={{ color: C2 }}>
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>
      </div>
    );
  }

  if (currentUser?.isExpert) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-green-100 p-5 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">You are already a verified expert!</h2>
        <p className="mt-2 text-sm text-gray-500">Head to My Articles to start writing.</p>
        <a
          href="/expert-articles"
          className="mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow"
          style={{ background: C2 }}
        >
          <BookOpen className="h-4 w-4" /> Go to My Articles
        </a>
      </div>
    );
  }

  if (myExpertApplication && !submitted) {
    const app = myExpertApplication;
    const statusMap = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50',
        label: 'Your application is under review. We will notify you within 48 hours.',
      },
      approved: {
        icon: CheckCircle2,
        color: 'text-green-600 bg-green-50',
        label: 'Congratulations! Your application was approved.',
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600 bg-red-50',
        label: app.reviewNote ?? 'Your application was not approved at this time.',
      },
    };
    const cfg = statusMap[app.status];
    const Icon = cfg.icon;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className={`rounded-full p-5 mb-4 ${cfg.color}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 capitalize">
          {app.status === 'pending' ? 'Application Submitted' : `Application ${app.status}`}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">{cfg.label}</p>
        {app.status !== 'rejected' && (
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-left space-y-2 text-sm">
            <p><span className="font-medium text-gray-600">Specialty:</span> {app.specialty}</p>
            <p><span className="font-medium text-gray-600">Experience:</span> {app.yearsOfExperience} years</p>
            <p><span className="font-medium text-gray-600">Consultation fee:</span> ${app.priceMin} &ndash; ${app.priceMax} / hr</p>
          </div>
        )}
        <a href="/" className="mt-5 flex items-center gap-1.5 text-sm font-medium" style={{ color: C2 }}>
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-green-100 p-5 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Application Submitted!</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Thank you! Our team will review your application within 48 hours and you will be notified.
        </p>
        <a href="/" className="mt-5 flex items-center gap-1.5 text-sm font-medium" style={{ color: C2 }}>
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>
      </div>
    );
  }

  const validateStep = (): string => {
    if (step === 0 && !form.specialty.trim()) return 'Please enter your specialty.';
    if (step === 1) {
      if (!form.yearsOfExperience || isNaN(Number(form.yearsOfExperience)))
        return 'Please enter your years of experience.';
      if (!form.priceMin || isNaN(Number(form.priceMin))) return 'Please enter minimum price.';
      if (!form.priceMax || isNaN(Number(form.priceMax))) return 'Please enter maximum price.';
      if (Number(form.priceMin) > Number(form.priceMax))
        return 'Minimum price cannot exceed maximum price.';
    }
    if (step === 2) {
      if (!form.credentials.trim()) return 'Please list your credentials.';
      if (!form.bio.trim()) return 'Please write a short bio.';
    }
    if (step === 3) {
      if (!form.agreeToTerms) return 'You must agree to the Expert Terms of Service.';
      if (!form.agreeAccuracy) return 'You must confirm the accuracy of your information.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const prev = () => { setError(''); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      await applyAsExpert({
        specialty: form.specialty.trim(),
        yearsOfExperience: Number(form.yearsOfExperience),
        licenseNumber: form.licenseNumber.trim() || undefined,
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        credentials: form.credentials.trim(),
        bio: form.bio.trim(),
        agreeToTerms: true,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f9ede9 0%, #f0e8f5 60%, #e8f4f0 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <a href="/" className="mb-8 flex items-center gap-1.5 text-sm font-medium" style={{ color: C2 }}>
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>

        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-sm shadow-xl p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-2xl p-3" style={{ background: `${C2}20` }}>
              <Stethoscope className="h-6 w-6" style={{ color: C2 }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Join as Expert</h1>
              <p className="text-sm text-gray-500">Share your expertise with thousands of mothers</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      background: i <= step ? C2 : '#e5e7eb',
                      color: i <= step ? 'white' : '#9ca3af',
                    }}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-medium text-center leading-tight hidden sm:block"
                    style={{ color: i === step ? C2 : '#9ca3af' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-1.5 rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ background: C2, width: `${(step / (STEP_LABELS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-1">
                <Stethoscope className="h-5 w-5" style={{ color: C2 }} /> Your Medical Specialty
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Specialty *</label>
                <Input placeholder="e.g. Obstetrics & Gynecology, Pediatrics, Lactation Consulting..." className="h-11" {...field('specialty')} />
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700 space-y-1">
                <p className="font-medium">What we are looking for</p>
                <p>Healthcare professionals in maternal health, pediatrics, mental health, nutrition, and related fields.</p>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-1">
                <DollarSign className="h-5 w-5" style={{ color: C2 }} /> Experience &amp; Consultation Pricing
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Years of Clinical Experience *</label>
                <Input type="number" min="0" max="60" placeholder="e.g. 8" className="h-11" {...field('yearsOfExperience')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Medical License / Registration Number (optional)</label>
                <Input placeholder="e.g. MD123456" className="h-11" {...field('licenseNumber')} />
                <p className="text-xs text-gray-400">Providing this helps speed up verification.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Min. Hourly Rate (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input type="number" min="0" placeholder="20" className="h-11 pl-7" {...field('priceMin')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Max. Hourly Rate (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input type="number" min="0" placeholder="100" className="h-11 pl-7" {...field('priceMax')} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">Your price range is displayed publicly on your expert profile and can be updated later.</p>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-1">
                <FileText className="h-5 w-5" style={{ color: C2 }} /> Credentials &amp; Bio
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Credentials &amp; Certifications *</label>
                <textarea
                  rows={4}
                  placeholder="List your medical degrees, board certifications, institution affiliations, notable training..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CB978E]/40 resize-none"
                  {...field('credentials')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Professional Bio *</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about yourself and why you want to contribute to Herizone. This will be shown on your public profile."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CB978E]/40 resize-none"
                  {...field('bio')}
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-1">
                <Shield className="h-5 w-5" style={{ color: C2 }} /> Legal Agreement
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-xs text-gray-600 space-y-3 max-h-52 overflow-y-auto leading-relaxed">
                <p className="font-semibold text-gray-700 text-sm">Expert Terms of Service</p>
                <p>By joining Herizone as a verified expert, you agree to provide accurate, evidence-based, and professionally responsible information.</p>
                <p>You confirm that you hold valid credentials in the specialty you have declared, and that any advice given on the platform does not replace a direct clinical consultation.</p>
                <p>You must not share any personally identifiable information of platform users outside of Herizone. Any breach of user confidentiality may result in immediate removal and potential legal action.</p>
                <p>Herizone reserves the right to remove content that does not meet our medical accuracy standards. Experts must respond to flagged content reviews within 72 hours.</p>
                <p>Your public profile, bio, specialty, and price range will be visible to all users of the platform, including guests.</p>
                <p>Herizone does not take a commission on external consultations arranged through the platform, but you must honour the price range you have listed.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors"
                  style={{ borderColor: form.agreeToTerms ? C2 : '#d1d5db', background: form.agreeToTerms ? C2 : 'white' }}
                  onClick={() => setForm((f) => ({ ...f, agreeToTerms: !f.agreeToTerms }))}
                >
                  {form.agreeToTerms && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <span className="text-sm text-gray-700">
                  I have read and agree to the <span className="font-semibold" style={{ color: C2 }}>Expert Terms of Service</span> and understand my responsibilities on the platform.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors"
                  style={{ borderColor: form.agreeAccuracy ? C2 : '#d1d5db', background: form.agreeAccuracy ? C2 : 'white' }}
                  onClick={() => setForm((f) => ({ ...f, agreeAccuracy: !f.agreeAccuracy }))}
                >
                  {form.agreeAccuracy && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <span className="text-sm text-gray-700">
                  I confirm that all information I have provided, including credentials, license number, and experience, is <span className="font-semibold">accurate and verifiable</span>.
                </span>
              </label>

              <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: `${C2}50`, background: `${C2}10` }}>
                <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C2 }} />
                <p className="text-xs text-gray-600">
                  After submission, our team will review your application within 48 hours. You will receive a notification when approved or if we need more information.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={prev} className="gap-2 rounded-full px-6" style={{ borderColor: C3, color: C2 }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            {step < STEP_LABELS.length - 1 ? (
              <Button type="button" onClick={next} className="gap-2 rounded-full px-6 text-white" style={{ background: `linear-gradient(135deg, ${C2}, ${C1})` }}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={saving} onClick={handleSubmit} className="gap-2 rounded-full px-8 text-white font-semibold" style={{ background: `linear-gradient(135deg, ${C2}, ${C1})` }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
