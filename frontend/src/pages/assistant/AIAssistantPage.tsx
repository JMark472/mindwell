import { useEffect, useRef, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { Bot, Send, User, Sparkles, Heart, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  assistantGreeting,
  assistantPrompts,
  getAssistantReply,
  type AssistantRole,
} from "@/lib/assistant";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistantPage() {
  const { user } = useAuth();
  const role: AssistantRole =
    user?.role === "counselor" ? "counselor" : user?.role === "admin" ? "admin" : "student";
  const isCounselor = role === "counselor";
  const isAdmin = role === "admin";
  const prompts = assistantPrompts[role];

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 1,
      role: "assistant",
      content: assistantGreeting(role, user?.fullName),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const delayRef = useRef<number | null>(null);
  const streamRef = useRef<number | null>(null);

  const busy = loading || streaming;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  useEffect(
    () => () => {
      if (delayRef.current !== null) window.clearTimeout(delayRef.current);
      if (streamRef.current !== null) window.clearInterval(streamRef.current);
    },
    [],
  );

  function stopTimers() {
    if (delayRef.current !== null) {
      window.clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (streamRef.current !== null) {
      window.clearInterval(streamRef.current);
      streamRef.current = null;
    }
  }

  function newChat() {
    stopTimers();
    setLoading(false);
    setStreaming(false);
    setStreamingId(null);
    setInput("");
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: assistantGreeting(role, user?.fullName),
      },
    ]);
  }

  async function send(prefilled?: string) {
    const text = (prefilled ?? input).trim();
    if (!text || busy) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    const reply = getAssistantReply(role, text).content;

    delayRef.current = window.setTimeout(() => {
      delayRef.current = null;
      setLoading(false);

      const assistantId = Date.now() + 1;
      setStreaming(true);
      setStreamingId(assistantId);
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      let cursor = 0;
      const step = Math.max(6, Math.ceil(reply.length / 140));

      streamRef.current = window.setInterval(() => {
        cursor = Math.min(reply.length, cursor + step);
        const visible = reply.slice(0, cursor);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: visible } : message,
          ),
        );

        if (cursor >= reply.length) {
          if (streamRef.current !== null) window.clearInterval(streamRef.current);
          streamRef.current = null;
          setStreaming(false);
          setStreamingId(null);
        }
      }, 18);
    }, 550);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-mint/20 to-teal/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-mint text-white shadow-[0_20px_60px_-30px_rgba(16,169,155,1)]">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Mindwell AI Assistant</h2>
                <Sparkles className="h-4 w-4 text-teal" />
              </div>
              <p className="text-sm text-ink-400">
                {isCounselor
                  ? "Professional support tool for counseling guidance"
                  : isAdmin
                    ? "Administrative support for users, safety, privacy, and operations"
                    : "Your supportive companion for wellbeing guidance"}
              </p>
            </div>
          </div>
          {messages.length > 1 ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-fit sm:ml-auto"
              onClick={newChat}
              disabled={busy}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New chat
            </Button>
          ) : null}
        </div>
      </Card>

      {messages.length === 1 && (
        <Card className="p-6">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal" />
            <h3 className="font-semibold">Suggested prompts</h3>
          </div>
          <p className="mb-4 text-xs text-ink-400">
            Tap a prompt for a detailed answer, or type your own question below.
          </p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => void send(prompt)}
                disabled={busy}
                className="rounded-full border border-line/80 bg-surface/90 px-4 py-2 text-left text-sm text-ink-600 transition-all hover:border-teal/40 hover:bg-mint-soft hover:text-teal-600 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex h-[68dvh] min-h-[460px] flex-col overflow-hidden lg:h-[640px]">
        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-mint text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
                    msg.role === "user"
                      ? "rounded-br-md bg-gradient-to-r from-teal to-teal-600 text-white shadow-sm"
                      : "rounded-bl-md border border-line/70 bg-white shadow-card"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                    {msg.role === "assistant" && msg.id === streamingId ? (
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-teal align-middle" />
                    ) : null}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-050 to-white text-navy ring-1 ring-line/70">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal to-mint text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-line/70 bg-white px-4 py-3 shadow-card">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0.2s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-line/70 bg-surface/50 p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={
                isCounselor
                  ? "Ask about a session, documentation, or clinical decision…"
                  : isAdmin
                    ? "Ask about accounts, passwords, reports, audit, privacy, or operations…"
                    : "Ask a question or share what's on your mind…"
              }
              className="max-h-[132px] min-h-[44px] flex-1 resize-none rounded-field border border-line/80 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/15"
            />
            <Button
              onClick={() => void send()}
              disabled={!input.trim() || busy}
              size="lg"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-400">
            <Heart className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {isCounselor
                ? "AI responses are professional support suggestions only. Review every recommendation against your clinical judgment, supervision, and institutional policy."
                : isAdmin
                  ? "AI responses are administrative guidance only. Verify actions against policy, privacy requirements, and audit/security best practices. Never share passwords except when securely delivering a newly set temporary password."
                  : "This AI provides supportive guidance only, not professional medical, crisis, or emergency care. Responses can be imperfect."}
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
