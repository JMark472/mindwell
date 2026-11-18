import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Heart,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
  Languages,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  assistantGreeting,
  assistantPrompts,
  getAssistantReply,
  type AssistantMessage,
  type AssistantOptions,
  type AssistantRole,
  type ResponseMode,
} from "@/lib/assistant";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
  prompt?: string;
};

const MODE_OPTIONS: { value: ResponseMode; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
];

const TRANSLATE_LANGUAGES = [
  { label: "English", prompt: "Translate the previous answer to English" },
  { label: "Filipino", prompt: "Translate the previous answer to Filipino" },
  { label: "Cebuano", prompt: "Translate the previous answer to Cebuano" },
  { label: "Spanish", prompt: "Translate the previous answer to Spanish" },
  { label: "Chinese", prompt: "Translate the previous answer to Chinese" },
  { label: "Japanese", prompt: "Translate the previous answer to Japanese" },
  { label: "Korean", prompt: "Translate the previous answer to Korean" },
  { label: "French", prompt: "Translate the previous answer to French" },
  { label: "German", prompt: "Translate the previous answer to German" },
  { label: "Arabic", prompt: "Translate the previous answer to Arabic" },
];

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
      followUps: prompts.slice(0, 3),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [responseMode, setResponseMode] = useState<ResponseMode>("standard");
  const [showTranslate, setShowTranslate] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const delayRef = useRef<number | null>(null);
  const streamRef = useRef<number | null>(null);
  const translateRef = useRef<HTMLDivElement>(null);

  const busy = loading || streaming;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, streamingId]);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (translateRef.current && !translateRef.current.contains(e.target as Node)) {
        setShowTranslate(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
    setError(null);
    setCopiedId(null);
    setShowTranslate(false);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: assistantGreeting(role, user?.fullName),
        followUps: prompts.slice(0, 3),
      },
    ]);
  }

  const historyFor = (all: Message[]): AssistantMessage[] =>
    all.map((m) => ({ role: m.role, content: m.content }));

  async function send(prefilled?: string, regenerateForId?: number, overrideMode?: ResponseMode) {
    const text = (prefilled ?? input).trim();
    if (!text || busy) return;

    setError(null);
    setShowTranslate(false);
    let baseMessages = messages;
    if (regenerateForId != null) {
      const idx = messages.findIndex((m) => m.id === regenerateForId);
      if (idx >= 0) {
        baseMessages = messages.slice(0, idx);
        setMessages(baseMessages);
      }
    } else {
      const userMsg: Message = { id: Date.now(), role: "user", content: text };
      baseMessages = [...messages, userMsg];
      setMessages(baseMessages);
      setInput("");
    }
    setLoading(true);
    inputRef.current?.focus();

    try {
      const opts: AssistantOptions = { mode: overrideMode ?? responseMode, preferredLanguage: "auto" };
      const reply = getAssistantReply(role, text, historyFor(baseMessages), opts);
      const content = reply.content || "I couldn’t generate a response right now. Please try asking in a different way.";
      const followUps = reply.followUps ?? [];

      delayRef.current = window.setTimeout(() => {
        delayRef.current = null;
        setLoading(false);

        const assistantId = Date.now() + 1;
        setStreaming(true);
        setStreamingId(assistantId);
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", followUps, prompt: text },
        ]);

        let cursor = 0;
        const step = Math.max(6, Math.ceil(content.length / 140));

        streamRef.current = window.setInterval(() => {
          cursor = Math.min(content.length, cursor + step);
          const visible = content.slice(0, cursor);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: visible } : message,
            ),
          );

          if (cursor >= content.length) {
            if (streamRef.current !== null) window.clearInterval(streamRef.current);
            streamRef.current = null;
            setStreaming(false);
            setStreamingId(null);
          }
        }, 16);
      }, 350);
    } catch {
      setLoading(false);
      setStreaming(false);
      setStreamingId(null);
      setError("Something went wrong while generating a response. Please try again.");
    }
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((id) => (id === message.id ? null : id)), 1500);
    } catch {
      setError("Could not copy the response. You can select and copy the text manually.");
    }
  }

  const hasAssistantReply = useMemo(
    () => messages.some((m) => m.role === "assistant" && m.id !== 0),
    [messages],
  );

  const latestAssistantFollowUps = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.id !== streamingId && m.followUps && m.followUps.length > 0) {
        return m.followUps;
      }
    }
    return prompts.slice(0, 3);
  }, [messages, prompts, streamingId]);

  const quickActions = [
    { label: "Simplify", prompt: "Explain in simple words" },
    { label: "Summarize", prompt: "Summarize the previous answer" },
    { label: "Step by step", prompt: "Explain it step by step" },
  ];

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
                  ? "Professional support with multilingual, adjustable, and easy-to-understand responses"
                  : isAdmin
                    ? "Administrative guidance with clear, adjustable, and multilingual responses"
                    : "Supportive, multilingual guidance with short or detailed explanations"}
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
            Ask in English, Filipino, Cebuano, or another language. You can also request translations and choose short or detailed answers.
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

      <Card className="flex h-[72dvh] min-h-[500px] flex-col overflow-hidden lg:h-[680px]">
        {error ? (
          <div className="border-b border-line/70 p-3 sm:px-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === "assistant" && idx === messages.length - 1 && streamingId !== msg.id;
              return (
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
                    className={`min-w-0 max-w-[88%] sm:max-w-[80%] ${
                      msg.role === "assistant" ? "flex flex-col items-start gap-1.5" : ""
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                    {msg.role === "assistant" && msg.content && msg.id !== streamingId ? (
                      <div className="flex flex-wrap items-center gap-1 px-1">
                        <button
                          type="button"
                          onClick={() => void copyMessage(msg)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-navy-050 hover:text-ink-600"
                          aria-label="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === msg.id ? "Copied" : "Copy"}
                        </button>
                        {isLastAssistant && msg.prompt ? (
                          <button
                            type="button"
                            onClick={() => void send(msg.prompt, msg.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-navy-050 hover:text-ink-600"
                            aria-label="Regenerate response"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Regenerate
                          </button>
                        ) : null}
                        {isLastAssistant ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void send("Make it shorter")}
                              disabled={busy}
                              className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-navy-050 hover:text-ink-600 disabled:opacity-50"
                            >
                              Shorter
                            </button>
                            <button
                              type="button"
                              onClick={() => void send("Give me a more detailed answer")}
                              disabled={busy}
                              className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-navy-050 hover:text-ink-600 disabled:opacity-50"
                            >
                              More detailed
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-050 to-white text-navy ring-1 ring-line/70">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal to-mint text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-line/70 bg-white px-4 py-3 shadow-card">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0.4s]"></span>
                    </div>
                    Thinking…
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-line/70 bg-surface/50 p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <Wand2 className="h-3.5 w-3.5" /> Response
              </span>
              <div className="inline-flex rounded-full border border-line/80 bg-white p-0.5">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResponseMode(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      responseMode === opt.value
                        ? "bg-teal text-white shadow-sm"
                        : "text-ink-500 hover:bg-navy-050"
                    }`}
                    aria-pressed={responseMode === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="hidden h-4 w-px bg-line/80 sm:block" />
              <div className="flex flex-wrap items-center gap-1.5">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => void send(a.prompt)}
                    disabled={busy || !hasAssistantReply}
                    className="rounded-full border border-line/80 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition-all hover:border-teal/40 hover:bg-mint-soft hover:text-teal-600 disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
                <div className="relative" ref={translateRef}>
                  <button
                    type="button"
                    onClick={() => setShowTranslate((v) => !v)}
                    disabled={busy || !hasAssistantReply}
                    className="inline-flex items-center gap-1 rounded-full border border-line/80 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition-all hover:border-teal/40 hover:bg-mint-soft hover:text-teal-600 disabled:opacity-50"
                    aria-expanded={showTranslate}
                  >
                    <Languages className="h-3.5 w-3.5" />
                    Translate
                  </button>
                  {showTranslate ? (
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-xl border border-line/70 bg-white p-1.5 shadow-lg">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                        Translate to
                      </p>
                      <div className="max-h-48 overflow-y-auto">
                        {TRANSLATE_LANGUAGES.map((lang) => (
                          <button
                            key={lang.label}
                            type="button"
                            onClick={() => void send(lang.prompt)}
                            className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink-600 hover:bg-mint-soft hover:text-teal-600"
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {!busy && latestAssistantFollowUps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {latestAssistantFollowUps.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-line/80 bg-white px-3 py-1.5 text-left text-xs text-ink-600 transition-all hover:border-teal/40 hover:bg-mint-soft hover:text-teal-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

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
                  ? "Ask, request a translation, or say “make it shorter” / “explain in simple words”…"
                  : isAdmin
                    ? "Ask about admin tasks, or request a short/detailed answer, translation, or summary…"
                    : "Ask anything, or say “translate to Cebuano”, “explain simply”, “give detailed answer”…"
              }
              className="max-h-[132px] min-h-[44px] flex-1 resize-none rounded-field border border-line/80 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/15"
              aria-label="Message"
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
                ? "AI responses are support suggestions only. Use clinical judgment, supervision, and policy. Translations/explanations are provided to aid understanding."
                : isAdmin
                  ? "AI responses are administrative guidance only. Verify actions against policy, privacy, and security. Never share sensitive data or passwords insecurely."
                  : "Supportive guidance only, not diagnosis or emergency care. If you may be in danger, contact emergency services or use Help & Crisis."}
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
