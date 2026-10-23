import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Primitives";
import PatternBackdrop from "@/components/ui/PatternBackdrop";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/api/client";
import {
  getConversation,
  listContacts,
  listConversations,
  markConversationRead,
  sendMessage,
  startConversation,
  type ChatContact,
  type ChatConversation,
  type ChatMessage,
} from "@/api/messages";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Search,
  SendHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: ChatConversation["otherRole"]) {
  if (role === "counselor") return "Counselor";
  if (role === "student") return "Student";
  return "Administrator";
}

function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: ChatConversation["otherRole"];
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        role === "counselor"
          ? "bg-navy-050 text-navy"
          : "bg-mint-soft text-teal-600",
        size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-xs",
      )}
    >
      {initials(name) || "MW"}
    </span>
  );
}

function RoleTag({ role }: { role: ChatConversation["otherRole"] }) {
  return (
    <span
      className={cn(
        "rounded-pill px-1.5 py-0.5 text-[10px] font-medium leading-none",
        role === "counselor"
          ? "bg-info-soft text-info"
          : role === "student"
            ? "bg-navy-050 text-ink-600"
            : "bg-warning-soft text-warning",
      )}
    >
      {roleLabel(role)}
    </span>
  );
}

function sameDay(a: string | Date, b: string | Date) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (sameDay(date, now)) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const linkedId = Number(searchParams.get("c"));
  const [activeId, setActiveId] = useState<number | null>(
    Number.isInteger(linkedId) && linkedId > 0 ? linkedId : null,
  );

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [startingId, setStartingId] = useState<number | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => contact.fullName.toLowerCase().includes(query));
  }, [contacts, contactSearch]);

  const refreshConversations = useCallback(async (silent = false) => {
    try {
      const data = await listConversations();
      setConversations(data.conversations);
      if (!silent) setError(null);
    } catch (err) {
      if (!silent) {
        setError(errorMessage(err, "Could not load your conversations."));
      }
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, []);

  // Initial inbox load + low-frequency polling for new threads/messages.
  useEffect(() => {
    void refreshConversations();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshConversations(true);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  // Load (and keep refreshing) the selected thread.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);
    setDraft("");
    setError(null);

    const load = async (first: boolean) => {
      try {
        const data = await getConversation(activeId);
        if (cancelled) return;

        setMessages(data.messages);
        setConversations((previous) => {
          const withoutCurrent = previous.filter(
            (conversation) => conversation.id !== data.conversation.id,
          );
          return [data.conversation, ...withoutCurrent].sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
          );
        });

        if (first || data.conversation.unreadCount > 0) {
          await markConversationRead(activeId);
          if (cancelled) return;
          setConversations((previous) =>
            previous.map((conversation) =>
              conversation.id === activeId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
          );
          window.dispatchEvent(new Event("mindwell:messages-changed"));
        }
      } catch (err) {
        if (cancelled) return;
        if (first) {
          setError(errorMessage(err, "Could not open that conversation."));
          setActiveId(null);
          setSearchParams({}, { replace: true });
        }
      } finally {
        if (!cancelled && first) setLoadingMessages(false);
      }
    };

    void load(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(false);
    }, 8_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeId, setSearchParams]);

  // Keep the newest message in view.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, loadingMessages, activeId]);

  function selectConversation(id: number) {
    setActiveId(id);
    setContactsOpen(false);
    setDraft("");
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
    setSearchParams({ c: String(id) }, { replace: true });
  }

  function closeConversation() {
    setActiveId(null);
    setSearchParams({}, { replace: true });
  }

  async function openContacts() {
    setContactsOpen(true);
    setContactSearch("");
    setContactsLoading(true);
    setError(null);
    try {
      setContacts(await listContacts());
    } catch (err) {
      setError(errorMessage(err, "Could not load contacts."));
    } finally {
      setContactsLoading(false);
    }
  }

  async function handleStart(contact: ChatContact) {
    setStartingId(contact.id);
    setError(null);
    try {
      const conversation = await startConversation(contact.id);
      setConversations((previous) => [
        conversation,
        ...previous.filter((item) => item.id !== conversation.id),
      ]);
      setContactsOpen(false);
      selectConversation(conversation.id);
      textareaRef.current?.focus();
    } catch (err) {
      setError(errorMessage(err, "Could not start that conversation."));
    } finally {
      setStartingId(null);
    }
  }

  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();
    if (!activeId || !draft.trim() || sending) return;

    const body = draft.trim();
    setSending(true);
    setError(null);
    try {
      const sent = await sendMessage(activeId, body);
      setMessages((previous) => [...previous, sent]);
      setDraft("");
      setConversations((previous) =>
        previous
          .map((conversation) =>
            conversation.id === activeId
              ? {
                  ...conversation,
                  lastMessageAt: sent.createdAt,
                  lastMessageBody: sent.body,
                  lastMessageSenderId: sent.senderUserId,
                  unreadCount: 0,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
          ),
      );
      window.dispatchEvent(new Event("mindwell:messages-changed"));
      textareaRef.current?.focus();
      void refreshConversations(true);
    } catch (err) {
      setError(errorMessage(err, "Your message could not be sent."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="grid h-[calc(100vh-13rem)] min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left rail: conversation list + pattern design */}
          <section
            className={cn(
              "relative flex min-h-0 flex-col border-line lg:border-r",
              activeId ? "hidden lg:flex" : "flex",
            )}
            aria-label="Conversations"
          >
            <PatternBackdrop curved={false} className="opacity-60" />

            <header className="relative z-10 border-b border-line/80 bg-surface/85 px-4 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">
                    {contactsOpen ? "New message" : "Messages"}
                  </h2>
                  <p className="truncate text-xs text-ink-400">
                    {contactsOpen
                      ? "Choose someone to talk to"
                      : "Private student–counselor conversations"}
                  </p>
                </div>
                {contactsOpen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactsOpen(false)}
                    aria-label="Close contact list"
                  >
                    <X aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void openContacts()}
                  >
                    <Plus aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                    New
                  </Button>
                )}
              </div>

              {contactsOpen ? (
                <div className="relative mt-3">
                  <Search
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
                  />
                  <input
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Search by name"
                    aria-label="Search contacts by name"
                    className="h-9 w-full rounded-field border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-300 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/15"
                  />
                </div>
              ) : null}
            </header>

            <div className="mw-scrollbar relative z-10 flex-1 overflow-y-auto">
              {contactsOpen ? (
                contactsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-ink-400">
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                      strokeWidth={1.8}
                    />
                    Loading contacts…
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm font-medium">No contacts found</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {user?.role === "student"
                        ? "Counselor accounts will appear here once they are active."
                        : "Student accounts will appear here once they are active."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line/70">
                    {filteredContacts.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => void handleStart(contact)}
                          disabled={startingId !== null}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-navy-050/70 disabled:opacity-60"
                        >
                          <Avatar name={contact.fullName} role={contact.role} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{contact.fullName}</p>
                            <RoleTag role={contact.role} />
                          </div>
                          {startingId === contact.id ? (
                            <Loader2
                              aria-hidden="true"
                              className="h-4 w-4 animate-spin text-ink-300"
                              strokeWidth={1.8}
                            />
                          ) : (
                            <ChevronRight
                              aria-hidden="true"
                              className="h-4 w-4 text-ink-300"
                              strokeWidth={1.8}
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : loadingConversations ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-ink-400">
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                    strokeWidth={1.8}
                  />
                  Loading conversations…
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft text-teal-600">
                    <MessageSquare
                      aria-hidden="true"
                      strokeWidth={1.8}
                      className="h-5 w-5"
                    />
                  </span>
                  <p className="mt-3 text-sm font-semibold">No conversations yet</p>
                  <p className="mt-1 max-w-[220px] text-xs text-ink-400">
                    Start a private conversation with a{" "}
                    {user?.role === "student" ? "counselor" : "student"}.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4"
                    onClick={() => void openContacts()}
                  >
                    <Plus aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-line/70">
                  {conversations.map((conversation) => {
                    const active = conversation.id === activeId;
                    const mine =
                      conversation.lastMessageSenderId !== null &&
                      conversation.lastMessageSenderId === user?.id;
                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors",
                            active
                              ? "bg-mint-soft/80"
                              : "hover:bg-navy-050/60",
                          )}
                        >
                          <Avatar
                            name={conversation.otherName}
                            role={conversation.otherRole}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-sm font-medium">
                                {conversation.otherName}
                              </p>
                              <span className="shrink-0 text-[11px] text-ink-300">
                                {formatListTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-0.5 truncate text-xs",
                                conversation.unreadCount > 0
                                  ? "font-medium text-ink-600"
                                  : "text-ink-400",
                              )}
                            >
                              {conversation.lastMessageBody
                                ? `${mine ? "You: " : ""}${conversation.lastMessageBody}`
                                : "No messages yet"}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <RoleTag role={conversation.otherRole} />
                              {conversation.unreadCount > 0 ? (
                                <span className="rounded-pill bg-teal px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                                  {conversation.unreadCount > 9
                                    ? "9+"
                                    : conversation.unreadCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Right pane: the thread */}
          <section
            className={cn(
              "flex min-h-0 flex-col bg-canvas/40",
              activeId ? "flex" : "hidden lg:flex",
            )}
            aria-label="Conversation"
          >
            {activeConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur">
                  <button
                    type="button"
                    onClick={closeConversation}
                    aria-label="Back to conversations"
                    className="flex h-9 w-9 items-center justify-center rounded-field text-ink-600 transition-colors hover:bg-navy-050 lg:hidden"
                  >
                    <ArrowLeft aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  </button>
                  <Avatar
                    name={activeConversation.otherName}
                    role={activeConversation.otherRole}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {activeConversation.otherName}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                      <RoleTag role={activeConversation.otherRole} />
                      <span>Mindwell</span>
                    </p>
                  </div>
                  <Lock
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="ml-auto h-4 w-4 text-ink-300"
                  />
                </header>

                <div
                  ref={scrollRef}
                  role="log"
                  aria-live="polite"
                  aria-label={`Conversation with ${activeConversation.otherName}`}
                  className="mw-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6"
                >
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-400">
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin"
                        strokeWidth={1.8}
                      />
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft text-teal-600">
                        <MessageSquare
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="h-6 w-6"
                        />
                      </span>
                      <p className="mt-3 text-sm font-semibold">Say hello</p>
                      <p className="mt-1 max-w-xs text-xs text-ink-400">
                        This is the beginning of your private conversation with{" "}
                        {activeConversation.otherName}.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((message, index) => {
                        const mine = message.senderUserId === user?.id;
                        const showDay =
                          index === 0 ||
                          !sameDay(messages[index - 1].createdAt, message.createdAt);
                        return (
                          <Fragment key={message.id}>
                            {showDay ? (
                              <div className="my-1 flex items-center gap-3">
                                <span className="h-px flex-1 bg-line" />
                                <span className="text-[11px] font-medium text-ink-300">
                                  {formatDayLabel(message.createdAt)}
                                </span>
                                <span className="h-px flex-1 bg-line" />
                              </div>
                            ) : null}

                            <div
                              className={cn(
                                "flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]",
                                mine ? "self-end items-end" : "self-start items-start",
                              )}
                            >
                              {!mine ? (
                                <span className="px-1 text-[11px] font-medium text-ink-400">
                                  {message.senderName}
                                </span>
                              ) : null}
                              <div
                                className={cn(
                                  "whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm shadow-card",
                                  mine
                                    ? "rounded-br-md bg-teal text-white"
                                    : "rounded-bl-md border border-line bg-surface text-ink",
                                )}
                              >
                                {message.body}
                              </div>
                              <span className="px-1 text-[10px] text-ink-300">
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSend}
                  className="border-t border-line bg-surface px-3 py-3 sm:px-4"
                >
                  <div className="flex items-end gap-2">
                    <label htmlFor="message-body" className="sr-only">
                      Write a message
                    </label>
                    <textarea
                      id="message-body"
                      ref={textareaRef}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={2}
                      maxLength={4000}
                      placeholder="Write a message…"
                      className="mw-scrollbar max-h-32 min-h-[46px] flex-1 resize-none rounded-field border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-300 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/15"
                    />
                    <Button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      aria-label="Send message"
                      className="h-[46px] shrink-0 px-3.5"
                    >
                      {sending ? (
                        <Loader2
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <SendHorizontal
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="h-4 w-4"
                        />
                      )}
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-300">
                    <ShieldCheck
                      aria-hidden="true"
                      strokeWidth={1.8}
                      className="h-3.5 w-3.5 shrink-0 text-teal"
                    />
                    Private to you and your counselor. Mindwell is not monitored
                    around the clock and is not an emergency service.
                  </p>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft text-teal-600">
                  <MessageSquare
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="h-6 w-6"
                  />
                </span>
                <p className="mt-3 text-base font-semibold">Select a conversation</p>
                <p className="mt-1 max-w-sm text-sm text-ink-400">
                  Choose a thread on the left, or start a new private conversation
                  with a {user?.role === "student" ? "counselor" : "student"}.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
