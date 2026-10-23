import { express } from "./client";

export interface ChatContact {
  id: number;
  fullName: string;
  role: "student" | "counselor" | "admin";
  status: "active" | "inactive" | "suspended";
}

export interface ChatConversation {
  id: number;
  lastMessageAt: string;
  lastReadAt: string | null;
  otherUserId: number;
  otherName: string;
  otherRole: "student" | "counselor" | "admin";
  lastMessageBody: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  senderRole: "student" | "counselor" | "admin";
  body: string;
  createdAt: string;
}

export async function listConversations() {
  const { data } = await express.get("/messages/conversations");
  return data.data as { conversations: ChatConversation[]; unread: number };
}

export async function getConversation(conversationId: number) {
  const { data } = await express.get(`/messages/conversations/${conversationId}`);
  return data.data as {
    conversation: ChatConversation;
    messages: ChatMessage[];
  };
}

export async function startConversation(participantId: number) {
  const { data } = await express.post("/messages/conversations", { participantId });
  return data.data.conversation as ChatConversation;
}

export async function listMessages(conversationId: number) {
  const { data } = await express.get(`/messages/conversations/${conversationId}/messages`);
  return data.data.messages as ChatMessage[];
}

export async function sendMessage(conversationId: number, body: string) {
  const { data } = await express.post(`/messages/conversations/${conversationId}/messages`, {
    body,
  });
  return data.data.message as ChatMessage;
}

export async function markConversationRead(conversationId: number) {
  await express.post(`/messages/conversations/${conversationId}/read`);
}

export async function getUnreadMessageCount() {
  const { data } = await express.get("/messages/unread");
  return data.data.unread as number;
}

export async function listContacts(search?: string) {
  const { data } = await express.get("/messages/contacts", {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return data.data.contacts as ChatContact[];
}
