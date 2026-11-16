import { useEffect, useRef, useState } from "react";
import { PhoneOff, Maximize2, Minimize2 } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

let jitsiScriptPromise: Promise<void> | null = null;
function loadJitsiScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (!jitsiScriptPromise) {
    jitsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-jitsi-external-api="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load call service")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.dataset.jitsiExternalApi = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load call service"));
      document.body.appendChild(script);
    });
  }
  return jitsiScriptPromise;
}

export type InPageCallInfo = {
  room: string;
  video: boolean;
  name: string;
};

export default function InPageCall({
  call,
  displayName,
  onClose,
  onError,
}: {
  call: InPageCallInfo;
  displayName?: string;
  onClose: () => void;
  onError?: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [expanded, setExpanded] = useState(call.video);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadJitsiScript();
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        containerRef.current.innerHTML = "";
        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: call.room,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || "Mindwell User" },
          configOverwrite: {
            prejoinConfig: { enabled: false },
            startWithAudioMuted: false,
            startWithVideoMuted: !call.video,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        });
        apiRef.current = api;
        const handleEnd = () => {
          if (!cancelled) onClose();
        };
        api.addEventListener("readyToClose", handleEnd);
        api.addEventListener("videoConferenceLeft", handleEnd);
        api.addEventListener("videoConferenceJoined", () => {
          if (!cancelled) setReady(true);
        });
      } catch {
        if (!cancelled) {
          onError?.("Could not start the call. Please check your connection and try again.");
          onClose();
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        apiRef.current?.dispose?.();
      } catch {
        // ignore
      }
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.room, call.video, displayName]);

  const hangup = () => {
    try {
      apiRef.current?.executeCommand?.("hangup");
      apiRef.current?.dispose?.();
    } catch {
      // ignore
    }
    apiRef.current = null;
    onClose();
  };

  return (
    <div
      className={
        expanded
          ? "fixed inset-2 z-50 flex flex-col overflow-hidden rounded-2xl border border-line bg-navy shadow-2xl sm:inset-4 md:inset-6"
          : "fixed bottom-4 right-4 z-50 flex h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-navy shadow-2xl sm:h-[520px]"
      }
      role="dialog"
      aria-label={call.video ? "Video call" : "Audio call"}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-navy px-3 py-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {call.video ? "Video call" : "Audio call"}
            {!ready ? " · Connecting…" : ""}
          </p>
          <p className="truncate text-xs text-white/70">{call.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label={expanded ? "Minimize call" : "Expand call"}
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <Minimize2 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            ) : (
              <Maximize2 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={hangup}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-status-danger text-white hover:opacity-90"
            aria-label="End call"
            title="End call"
          >
            <PhoneOff aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 bg-black" />
    </div>
  );
}
