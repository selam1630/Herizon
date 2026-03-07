'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fetchConsultationMessages, getAccessToken, sendConsultationMessage, type ConsultationMessage } from '@/lib/api';
import { MessageSquare, Mic, Phone, Video } from 'lucide-react';

type RoomMessage = {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  mine?: boolean;
};

function buildWsUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  if (apiBase.startsWith('https://')) return apiBase.replace('https://', 'wss://');
  if (apiBase.startsWith('http://')) return apiBase.replace('http://', 'ws://');
  return `ws://${apiBase}`;
}

export function ConsultationPage() {
  const { activeConsultation, currentUser, setView, clearActiveConsultation } = useAppStore();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<RoomMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [videoTime, setVideoTime] = useState('');
  const [videoNotes, setVideoNotes] = useState('');
  const [videoSaved, setVideoSaved] = useState('');
  const [audioText, setAudioText] = useState('');
  const [audioEvents, setAudioEvents] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connecting' | 'connected' | 'closed' | 'error'>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);

  const consultationTitle = useMemo(() => {
    if (!activeConsultation) return 'Consultation';
    if (activeConsultation.mode === 'chat') return 'Chat Room';
    if (activeConsultation.mode === 'video') return 'Video Session';
    return 'Audio Session';
  }, [activeConsultation]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (!activeConsultation) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#ecddd9] bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">No active consultation session.</p>
          <Button className="mt-4" onClick={() => setView('experts')}>
            Back to Experts
          </Button>
        </div>
      </div>
    );
  }

  const connectAudioSocket = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    let token = '';
    try {
      token = await getAccessToken();
    } catch (_error) {
      setWsStatus('error');
      setAudioEvents((prev) => ['Authentication required. Please sign in again.', ...prev].slice(0, 30));
      return;
    }
    const socketUrl = `${buildWsUrl()}/ws/audio?txRef=${encodeURIComponent(activeConsultation.txRef)}&token=${encodeURIComponent(token)}`;
    setWsStatus('connecting');
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      setAudioEvents((prev) => [`Connected to audio room ${activeConsultation.txRef}`, ...prev].slice(0, 30));
    };
    ws.onmessage = (event) => {
      const text = typeof event.data === 'string' ? event.data : '[binary audio chunk received]';
      setAudioEvents((prev) => [text, ...prev].slice(0, 30));
    };
    ws.onerror = () => setWsStatus('error');
    ws.onclose = (event) => {
      setWsStatus('closed');
      if (event.code === 1008) {
        setAudioEvents((prev) => ['Access denied for this consultation room.', ...prev].slice(0, 30));
      }
    };
  };

  const disconnectAudioSocket = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  const sendAudioTextEvent = () => {
    const content = audioText.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'note', content, at: new Date().toISOString() }));
    setAudioText('');
  };

  const startAudioRecording = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setAudioEvents((prev) => ['Connect socket first, then start recording.', ...prev].slice(0, 30));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start(700);
      setRecording(true);
      setAudioEvents((prev) => ['Recording started...', ...prev].slice(0, 30));
    } catch (_error) {
      setAudioEvents((prev) => ['Microphone permission failed.', ...prev].slice(0, 30));
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setAudioEvents((prev) => ['Recording stopped.', ...prev].slice(0, 30));
  };

  useEffect(() => {
    if (!activeConsultation || activeConsultation.mode !== 'chat') return;
    let active = true;
    const txRef = activeConsultation.txRef;

    const mapMessage = (msg: ConsultationMessage): RoomMessage => ({
      id: msg.id,
      author: msg.senderUserId === currentUser.id ? 'You' : msg.senderName,
      content: msg.content,
      timestamp: msg.createdAt,
      mine: msg.senderUserId === currentUser.id,
    });

    async function loadMessages() {
      try {
        setChatLoading(true);
        const rows = await fetchConsultationMessages(txRef);
        if (!active) return;
        setChatMessages(rows.map(mapMessage));
        setChatError('');
      } catch (error) {
        if (!active) return;
        setChatError(error instanceof Error ? error.message : 'Failed to load consultation chat');
      } finally {
        if (active) setChatLoading(false);
      }
    }

    void loadMessages();
    const timer = window.setInterval(() => {
      void loadMessages();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activeConsultation, currentUser.id]);

  const sendChatMessage = async () => {
    const content = chatInput.trim();
    if (!content) return;
    if (!activeConsultation) return;
    try {
      const sent = await sendConsultationMessage(activeConsultation.txRef, content);
      setChatMessages((prev) => [
        ...prev,
        {
          id: sent.id,
          author: sent.senderUserId === currentUser.id ? 'You' : sent.senderName,
          content: sent.content,
          timestamp: sent.createdAt,
          mine: sent.senderUserId === currentUser.id,
        },
      ]);
      setChatInput('');
      setChatError('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const saveVideoSchedule = () => {
    if (!videoTime.trim()) return;
    setVideoSaved(`Video session requested at ${videoTime}. Notes saved.`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 rounded-2xl border border-[#ecddd9] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#cb978e]">Consultation</p>
            <h1 className="text-xl font-semibold text-foreground">{consultationTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Expert: {activeConsultation.expertName} | Ref: {activeConsultation.txRef}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setView('experts')}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearActiveConsultation();
                setView('experts');
              }}
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {activeConsultation.mode === 'chat' && (
        <div className="rounded-2xl border border-[#ecddd9] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-[#cb978e]" />
            Chat room with {activeConsultation.expertName}
          </div>
          <div className="mb-3 h-64 space-y-2 overflow-y-auto rounded-xl border border-[#ecddd9] bg-[#fffafb] p-3">
            {chatLoading && <p className="text-xs text-muted-foreground">Loading chat...</p>}
            {!chatLoading && chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground">Start your consultation conversation.</p>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-2 text-xs ${msg.mine ? 'ml-auto max-w-[85%] bg-[#cb978e] text-white' : 'bg-white max-w-[85%]'}`}
              >
                <p className="font-semibold">{msg.author}</p>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          {chatError && <p className="mb-2 text-xs text-destructive">{chatError}</p>}
          <div className="flex items-end gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="min-h-[46px] resize-none"
              placeholder="Type message..."
            />
            <Button onClick={() => void sendChatMessage()}>Send</Button>
          </div>
        </div>
      )}

      {activeConsultation.mode === 'video' && (
        <div className="rounded-2xl border border-[#ecddd9] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Video className="h-4 w-4 text-[#cb978e]" />
            Set video session time
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="datetime-local" value={videoTime} onChange={(e) => setVideoTime(e.target.value)} />
            <Button onClick={saveVideoSchedule}>Save Video Time</Button>
          </div>
          <Textarea
            className="mt-3 min-h-[110px] resize-none"
            placeholder="Notes for expert before video call..."
            value={videoNotes}
            onChange={(e) => setVideoNotes(e.target.value)}
          />
          {videoSaved && <p className="mt-2 text-xs text-green-600">{videoSaved}</p>}
        </div>
      )}

      {activeConsultation.mode === 'voice' && (
        <div className="rounded-2xl border border-[#ecddd9] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-[#cb978e]" />
            Audio consultation (WebSocket)
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-[#d4b9b2] px-2 py-1 text-[#cb978e]">
              Socket: {wsStatus}
            </span>
            <Button size="sm" variant="outline" onClick={() => void connectAudioSocket()}>
              Connect
            </Button>
            <Button size="sm" variant="outline" onClick={disconnectAudioSocket}>
              Disconnect
            </Button>
            {!recording ? (
              <Button size="sm" onClick={startAudioRecording}>
                <Mic className="mr-1 h-3.5 w-3.5" />
                Start Recording
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={stopAudioRecording}>
                Stop Recording
              </Button>
            )}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
              placeholder="Optional text event to audio room..."
            />
            <Button onClick={sendAudioTextEvent}>Send</Button>
          </div>
          <div className="h-52 overflow-y-auto rounded-xl border border-[#ecddd9] bg-[#fffafb] p-3 text-xs">
            {audioEvents.length === 0 ? (
              <p className="text-muted-foreground">No audio events yet.</p>
            ) : (
              audioEvents.map((line, index) => (
                <p key={`${line}-${index}`} className="mb-1 break-words">{line}</p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
