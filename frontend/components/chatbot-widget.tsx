'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, X, Send, Sparkles, Minimize2, PhoneCall, Mic, MicOff, Volume2 } from 'lucide-react';

const QUICK_PROMPTS = [
  'How do I manage morning sickness?',
  'When should I worry about my baby\'s crying?',
  'Tips for breastfeeding difficulties',
  'Signs of postpartum depression',
];

const VOICE_MENU_INFO = {
  '1': 'Pregnancy advice',
  '2': 'Baby health',
  '3': 'Breastfeeding help',
  '4': 'Ask question by voice',
} as const;

const VOICE_MENU_RESPONSES = {
  '1': 'Pregnancy tip: if you have heavy bleeding, severe pain, fever, or reduced baby movement, seek urgent care immediately.',
  '2': 'Baby health tip: if your baby has trouble breathing, high fever, repeated vomiting, poor feeding, or unusual sleepiness, seek urgent care immediately.',
  '3': 'Breastfeeding tip: feed often, check deep latch, and track wet diapers. If feeding is painful or baby is not gaining weight, contact a clinician.',
} as const;

type VoiceMenuOption = keyof typeof VOICE_MENU_INFO;
type BrowserSpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): BrowserSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const maybeCtor = (window as unknown as {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  }).SpeechRecognition
    || (window as unknown as {
      SpeechRecognition?: BrowserSpeechRecognitionCtor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    }).webkitSpeechRecognition;

  return maybeCtor || null;
}

export function ChatbotWidget() {
  const { chatOpen, chatMessages, chatLoading, setChatOpen, sendChatMessage } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceOption, setVoiceOption] = useState<VoiceMenuOption>('1');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [awaitingVoiceAiReply, setAwaitingVoiceAiReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<InstanceType<BrowserSpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    if (chatOpen && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen, minimized]);

  useEffect(() => {
    if (chatOpen && !minimized) {
      textareaRef.current?.focus();
    }
  }, [chatOpen, minimized]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || chatLoading) return;
    sendChatMessage(content);
    setInputValue('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendChatMessage(prompt);
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceOptionSelect = (option: VoiceMenuOption) => {
    setVoiceOption(option);
    setVoiceStatus(`Selected: ${VOICE_MENU_INFO[option]}`);
  };

  const handleVoiceMenuRun = () => {
    if (voiceOption === '4') {
      setVoiceStatus('Press Start Recording and ask your question.');
      return;
    }

    const response = VOICE_MENU_RESPONSES[voiceOption as '1' | '2' | '3'];
    sendChatMessage(`Voice menu ${voiceOption}: ${VOICE_MENU_INFO[voiceOption]}`);
    setVoiceStatus('Played quick support response.');
    speakText(response);
  };

  const startVoiceRecording = () => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      setVoiceStatus('Speech recognition is not supported in this browser.');
      return;
    }

    setVoiceBusy(true);
    setVoiceStatus('Listening...');
    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (!transcript) {
        setVoiceStatus('No speech detected. Try again.');
        return;
      }

      setVoiceStatus('Sending your voice question to AI...');
      setAwaitingVoiceAiReply(true);
      sendChatMessage(transcript);
    };
    recognition.onerror = (event) => {
      setVoiceStatus(`Voice error: ${event?.error || 'unknown'}`);
      setVoiceBusy(false);
    };
    recognition.onend = () => {
      setVoiceBusy(false);
    };
    recognition.start();
  };

  const stopVoiceRecording = () => {
    recognitionRef.current?.stop();
  };

  useEffect(() => {
    if (!awaitingVoiceAiReply) return;
    const latest = chatMessages[chatMessages.length - 1];
    if (!latest?.isAi) return;
    speakText(latest.content);
    setVoiceStatus('AI voice response played.');
    setAwaitingVoiceAiReply(false);
  }, [awaitingVoiceAiReply, chatMessages]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Open AI support chat"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-card shadow-xl transition-all duration-200 ${
        minimized ? 'h-14 w-72' : 'h-[520px] w-80 sm:w-96'
      }`}
      role="dialog"
      aria-label="AI Support Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-primary px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground leading-none">
              Bloom AI
            </p>
            <p className="mt-0.5 text-xs text-primary-foreground/70">
              {chatLoading ? 'Typing...' : 'Always here for you'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded-md p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="rounded-md p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label="Close chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Disclaimer */}
          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              General information only — not medical advice. Always consult your healthcare provider.
            </p>
          </div>

          <div className="border-b border-border px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mode
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant={voiceMode ? 'outline' : 'default'} onClick={() => setVoiceMode(false)} className="h-7 px-2 text-[11px]">
                  Text
                </Button>
                <Button size="sm" variant={voiceMode ? 'default' : 'outline'} onClick={() => setVoiceMode(true)} className="h-7 px-2 text-[11px]">
                  <PhoneCall className="mr-1 h-3 w-3" />
                  Simulated Call
                </Button>
              </div>
            </div>
          </div>

          {voiceMode && (
            <div className="border-b border-border bg-muted/10 px-4 py-3">
              <p className="text-xs text-foreground">Call Menu</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Press 1-4 then run.</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['1', '2', '3', '4'] as VoiceMenuOption[]).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={voiceOption === option ? 'default' : 'outline'}
                    className="justify-start text-[11px]"
                    onClick={() => handleVoiceOptionSelect(option)}
                  >
                    {option}. {VOICE_MENU_INFO[option]}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleVoiceMenuRun} className="text-[11px]">
                  Run Menu Option
                </Button>
                {voiceOption === '4' && (
                  <>
                    <Button size="sm" onClick={startVoiceRecording} disabled={voiceBusy} className="text-[11px]">
                      <Mic className="mr-1 h-3 w-3" />
                      Start Recording
                    </Button>
                    <Button size="sm" variant="outline" onClick={stopVoiceRecording} disabled={!voiceBusy} className="text-[11px]">
                      <MicOff className="mr-1 h-3 w-3" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
              {voiceStatus && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  {voiceStatus}
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.isAi ? '' : 'flex-row-reverse'}`}
              >
                {message.isAi && (
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Heart className="h-3.5 w-3.5" fill="currentColor" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    message.isAi
                      ? 'rounded-tl-sm bg-muted text-foreground'
                      : 'rounded-tr-sm bg-primary text-primary-foreground'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Heart className="h-3.5 w-3.5" fill="currentColor" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts — only show if 1 message (just the greeting) */}
          {chatMessages.length === 1 && (
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-xs text-muted-foreground">Suggested questions</p>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                    disabled={chatLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder="Ask anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[40px] max-h-24 resize-none rounded-xl border-input text-xs leading-relaxed"
                disabled={chatLoading}
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || chatLoading}
                className="h-9 w-9 shrink-0 rounded-xl"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
