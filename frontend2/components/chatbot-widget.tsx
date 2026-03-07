'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { CheckCircle2, Heart, Minimize2, Send, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

const QUICK_PROMPTS = [
  'How do I manage morning sickness?',
  'When should I worry about my baby\'s crying?',
  'Tips for breastfeeding difficulties',
  'Signs of postpartum depression',
  'Safe exercises during pregnancy',
  'Baby sleep schedules by age',
];

export function ChatbotWidget() {
  const router = useRouter();
  const { chatOpen, chatMessages, chatLoading, setChatOpen, sendChatMessage, sendFeedback, isAuthenticated } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    sendChatMessage(content);
    setInputValue('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    sendChatMessage(prompt);
  };

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    await sendFeedback(messageId, isHelpful);
    setFeedbackGiven({ ...feedbackGiven, [messageId]: true });
  };

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-pink-500/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400 focus-visible:ring-offset-2 animate-pulse"
        aria-label="Open AI support chat"
      >
        <Sparkles className="h-7 w-7" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-8 right-8 z-50 flex flex-col rounded-3xl border-2 border-pink-200 dark:border-pink-200 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-2xl backdrop-blur-sm transition-all duration-300',
        minimized ? 'h-16 w-96' : 'h-[700px] w-[480px]'
      )}
      role="dialog"
      aria-label="Bloom AI Support Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-t-3xl bg-gradient-to-r from-blue-500 via-blue-300 to-pink-200 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
            <Heart className="h-6 w-6 text-white animate-pulse" fill="currentColor" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none flex items-center gap-2">
              Bloom AI
              <CheckCircle2 className="h-4 w-4" />
            </p>
            <p className="mt-1 text-sm text-white/90 font-medium">
              {chatLoading ? 'Thinking...' : 'Always here to help ✨'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded-xl p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="rounded-xl p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Disclaimer */}
          <div className="border-b-2 border-pink-100 dark:border-pink-900/50 bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20 px-5 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              💡 General information only — not medical advice. Always consult your healthcare provider.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scroll-smooth">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                  message.isAi ? '' : 'flex-row-reverse'
                )}
              >
                {message.isAi && (
                  <Avatar className="h-9 w-9 shrink-0 mt-1 ring-2 ring-pink-200 dark:ring-pink-800">
                    <AvatarFallback className="bg-gradient-to-br from-pink-200 to-blue-300 text-white">
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md',
                      message.isAi
                        ? 'rounded-tl-sm bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-gray-850 text-foreground border border-pink-100 dark:border-pink-900/30'
                        : 'rounded-tr-sm bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-pink-500/30'
                    )}
                  >
                    {message.isAi ? (
                      <div className="prose prose-pink prose-sm max-w-none dark:prose-invert [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0 [&>h1]:mt-2 [&>h2]:mt-2 [&>h3]:mt-2 [&>code]:text-pink-700 [&>pre]:bg-gray-100 dark:[&>pre]:bg-gray-800 [&>a]:text-pink-500">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                  
                  {/* Confidence & Feedback */}
                  {message.isAi && message.id !== 'msg-welcome' && (
                    <div className="flex items-center gap-3 px-2">
                      {message.confidence !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  i < Math.floor((message.confidence || 0) / 33)
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-700'
                                )}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{message.confidence}%</span>
                        </div>
                      )}
                      {message.sourceCount !== undefined && message.sourceCount > 0 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          📚 {message.sourceCount} {message.sourceCount === 1 ? 'source' : 'sources'}
                        </div>
                      )}
                      {!feedbackGiven[message.id] && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => handleFeedback(message.id, true)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-950"
                            aria-label="Helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, false)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                            aria-label="Not helpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {feedbackGiven[message.id] && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium ml-auto">
                          Thanks for your feedback! 💚
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                <Avatar className="h-9 w-9 shrink-0 mt-1 ring-2 ring-pink-200 dark:ring-pink-800">
                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                    <Heart className="h-4 w-4" fill="currentColor" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-gray-850 border border-pink-100 dark:border-pink-900/30 px-5 py-4 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts — only show if 1 message (just the greeting) */}
          {chatMessages.length === 1 && (
            <div className="border-t-2 border-pink-100 dark:border-pink-900/50 px-5 py-4 bg-gradient-to-r from-pink-50/30 to-purple-50/30 dark:from-pink-950/10 dark:to-purple-950/10">
              <p className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                ✨ Popular questions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-xl border-2 border-pink-200 dark:border-pink-900/50 bg-white dark:bg-gray-900 px-3 py-2.5 text-left text-xs font-medium text-foreground transition-all hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-950/30 dark:hover:to-purple-950/30 hover:shadow-md disabled:opacity-50"
                    disabled={chatLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          {showLoginPrompt && (
            <div className="mb-3 rounded-lg border border-pink-200 bg-pink-50/60 p-3 text-center">
              <p className="text-sm font-medium">Please sign in to use Bloom chat.</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  onClick={() => router.push('/auth')}
                  className="rounded-md bg-pink-500 text-white px-3 py-1.5"
                >
                  Log in / Sign up
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowLoginPrompt(false)}
                  className="rounded-md px-3 py-1.5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="border-t-2 border-pink-100 dark:border-pink-900/50 p-4 bg-white/50 dark:bg-gray-950/50 rounded-b-3xl">
            <div className="flex items-end gap-3">
              <Textarea
                ref={textareaRef}
                placeholder="Ask anything about pregnancy, parenting, or health..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[48px] max-h-32 resize-none rounded-xl border-2 border-pink-200 dark:border-pink-900/50 text-sm leading-relaxed focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                disabled={chatLoading}
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || chatLoading}
                className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-pink-500/50 transition-all duration-200"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
