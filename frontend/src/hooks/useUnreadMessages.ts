import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { getUnreadMessageCount } from "@/api/messages";

/*
 * One shared unread-message counter for every component that shows a badge.
 *
 * The header and the sidebar are mounted at the same time, so a naive hook
 * would poll twice. This module keeps a single interval, de-duplicates
 * in-flight requests, and fans the result out to all subscribers.
 */
let currentUnread = 0;
let inFlight: Promise<void> | null = null;
let inFlightSeq = 0;
let pollTimer: number | null = null;
let subscriberCount = 0;

const listeners = new Set<(value: number) => void>();

function publish(value: number) {
  currentUnread = value;
  listeners.forEach((listener) => listener(value));
}

/**
 * Refreshes the shared counter. A forced refresh (used after a mutation such
 * as marking a thread read) supersedes an in-flight poll so a stale response
 * can never overwrite the newer value.
 */
function refreshUnread(force = false) {
  if (inFlight && !force) return inFlight;

  const seq = ++inFlightSeq;
  const request = getUnreadMessageCount()
    .then((value) => {
      if (seq === inFlightSeq) publish(value);
    })
    .catch(() => {
      // Polling failures stay invisible; the last known count is still useful.
    })
    .finally(() => {
      if (seq === inFlightSeq) inFlight = null;
    });

  inFlight = request;
  return request;
}

function ensurePolling() {
  if (pollTimer !== null) return;
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") void refreshUnread();
  }, 30_000);
}

function stopPolling() {
  if (pollTimer !== null) window.clearInterval(pollTimer);
  pollTimer = null;
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(currentUnread);

  const canMessage = user?.role === "student" || user?.role === "counselor";

  useEffect(() => {
    if (!canMessage) {
      setUnread(0);
      return;
    }

    const listener = (value: number) => setUnread(value);
    listeners.add(listener);
    subscriberCount += 1;
    ensurePolling();
    void refreshUnread();

    const onChange = () => void refreshUnread(true);
    window.addEventListener("mindwell:messages-changed", onChange);

    return () => {
      listeners.delete(listener);
      subscriberCount = Math.max(0, subscriberCount - 1);
      window.removeEventListener("mindwell:messages-changed", onChange);
      if (subscriberCount === 0) {
        stopPolling();
        currentUnread = 0;
      }
    };
  }, [canMessage]);

  // A navigation is a good moment to refresh, but the request is shared.
  useEffect(() => {
    if (canMessage) void refreshUnread();
  }, [canMessage, pathname]);

  return unread;
}
