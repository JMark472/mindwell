import { useEffect, useMemo, useRef, useState } from "react";
import {
  PhoneOff,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Volume2,
  Wifi,
  WifiOff,
  ShieldCheck,
  Clock3,
  CalendarDays,
  UserRound,
  BadgeCheck,
  Info,
  LoaderCircle,
} from "lucide-react";

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

export type InPageCallSessionDetails = {
  participantLabel?: string;
  participantName?: string;
  participantRole?: "student" | "counselor" | "participant";
  counterpartName?: string;
  counterpartRole?: "student" | "counselor" | "participant";
  scheduledAt?: string;
  durationLabel?: string;
  status?: string;
  sessionType?: string;
  notes?: string | null;
};

export type InPageCallInfo = {
  room: string;
  video: boolean;
  name: string;
  details?: InPageCallSessionDetails;
};

function formatMaybeDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "border-[#2E8B57]/30 bg-[#DDF3E5] text-[#145A43]"
      : tone === "warning"
        ? "border-amber-300/60 bg-amber-50 text-amber-800"
        : tone === "danger"
          ? "border-red-300/60 bg-red-50 text-red-700"
          : "border-white/15 bg-white/10 text-[#DCEDE3]";
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", cls)}>
      {children}
    </span>
  );
}

function ControlButton({
  active,
  disabled,
  danger,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  label: string;
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className={cx(
        "group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8B57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3D2E] sm:h-12 sm:w-12",
        danger
          ? "border-red-500/30 bg-red-600 text-white hover:scale-105 hover:bg-red-500 shadow-[0_10px_24px_-14px_rgba(220,38,38,0.9)]"
          : active
            ? "border-[#2E8B57]/40 bg-[#145A43] text-white hover:scale-105 hover:bg-[#1B6B50] shadow-[0_10px_24px_-14px_rgba(20,90,67,0.95)]"
            : "border-[#d8e7df] bg-[#eef5f1] text-[#163D30] hover:scale-105 hover:bg-[#e3efe8]",
        disabled && !danger && "cursor-not-allowed opacity-55 hover:scale-100 hover:bg-[#eef5f1]",
      )}
    >
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B3D2E] px-2 py-1 text-[10px] font-medium text-white shadow-lg ring-1 ring-white/10 group-hover:block group-focus-visible:block">
        {title}
      </span>
    </button>
  );
}

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
  const [connection, setConnection] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(!call.video);
  const [showInfo, setShowInfo] = useState(call.video);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setConnection("connecting");
        setJoined(false);
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
            TOOLBAR_BUTTONS: [],
          },
        });
        apiRef.current = api;

        const handleEnd = () => {
          if (!cancelled) {
            setConnection("disconnected");
            onClose();
          }
        };
        api.addEventListener("readyToClose", handleEnd);
        api.addEventListener("videoConferenceLeft", handleEnd);
        api.addEventListener("videoConferenceJoined", () => {
          if (cancelled) return;
          setJoined(true);
          setConnection("connected");
        });
        api.addEventListener("audioMuteStatusChanged", (e: any) => {
          if (!cancelled) setAudioMuted(!!e?.muted);
        });
        api.addEventListener("videoMuteStatusChanged", (e: any) => {
          if (!cancelled) setVideoMuted(!!e?.muted);
        });
        api.addEventListener?.("participantLeft", () => {
          // keep connection active unless conference left; no-op
        });
      } catch {
        if (!cancelled) {
          setConnection("disconnected");
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

  const toggleAudio = () => {
    try {
      apiRef.current?.executeCommand?.("toggleAudio");
    } catch {
      // ignore
    }
  };
  const toggleVideo = () => {
    try {
      apiRef.current?.executeCommand?.("toggleVideo");
    } catch {
      // ignore
    }
  };
  const toggleShare = () => {
    try {
      apiRef.current?.executeCommand?.("toggleShareScreen");
    } catch {
      // ignore
    }
  };

  const details = call.details;
  const scheduledText = formatMaybeDate(details?.scheduledAt);
  const participantName = details?.participantName || call.name || "Participant";
  const counterpartName = details?.counterpartName;
  const sessionType = details?.sessionType || (call.video ? "Video counseling session" : "Audio counseling session");
  const status = details?.status || (joined ? "In progress" : "Connecting");

  const initials = useMemo(() => {
    const base = participantName.trim() || "MindWell";
    return base
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "MW";
  }, [participantName]);

  return (
    <div
      className={cx(
        "fixed z-50 flex flex-col overflow-hidden rounded-[24px] border border-[#1B6B50]/30 bg-[#0B3D2E] text-white shadow-[0_30px_80px_-30px_rgba(11,61,46,0.9)]",
        expanded ? "inset-2 sm:inset-4 md:inset-5 lg:inset-6" : "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 h-[min(75vh,560px)] w-[min(94vw,420px)] sm:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:right-4 lg:bottom-4 lg:h-[560px]",
      )}
      role="dialog"
      aria-label={call.video ? "Video call session" : "Audio call session"}
    >
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0B3D2E] via-[#145A43] to-[#1B6B50] px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white sm:text-base">
                {call.video ? "Video Call Session" : "Audio Call Session"}
              </p>
              <StatusPill tone={connection === "connected" ? "success" : connection === "connecting" ? "warning" : "danger"}>
                {connection === "connected" ? <Wifi className="h-3 w-3" /> : connection === "connecting" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <WifiOff className="h-3 w-3" />}
                {connection === "connected" ? "Connected" : connection === "connecting" ? "Connecting…" : "Disconnected"}
              </StatusPill>
            </div>
            <p className="mt-1 truncate text-xs text-[#DCEDE3] sm:text-sm">
              {participantName}{counterpartName ? ` · ${counterpartName}` : ""} · {sessionType}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              className={cx(
                "hidden h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:inline-flex",
                showInfo ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-transparent text-[#DCEDE3] hover:bg-white/10 hover:text-white",
              )}
              title={showInfo ? "Hide session details" : "Show session details"}
              aria-label={showInfo ? "Hide session details" : "Show session details"}
            >
              <Info className="h-3.5 w-3.5" />
              Details
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#DCEDE3] transition-colors hover:bg-white/10 hover:text-white"
              aria-label={expanded ? "Minimize call" : "Expand call"}
              title={expanded ? "Minimize" : "Expand"}
            >
              {expanded ? <Minimize2 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" /> : <Maximize2 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={hangup}
              className="hidden h-9 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-500 sm:inline-flex"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              End
            </button>
          </div>
        </div>
      </div>

      <div className={cx("flex min-h-0 flex-1 flex-col lg:flex-row", expanded ? "" : "")}>
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#081f18]">
          <div className="relative min-h-0 flex-1">
            <div ref={containerRef} className="absolute inset-0 bg-[#061913]" />

            {!joined ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-[#0B3D2E]/70 via-[#081f18]/80 to-[#081f18] p-4">
                <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0B3D2E]/80 p-5 text-center shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#145A43] to-[#2E8B57] text-xl font-semibold text-white ring-1 ring-white/20">
                    {initials}
                  </div>
                  <p className="text-base font-semibold text-white">{connection === "disconnected" ? "Unable to connect" : "Preparing your secure session"}</p>
                  <p className="mt-1 text-sm text-[#DCEDE3]">
                    {connection === "connecting"
                      ? "Connecting to the counseling room. Please allow microphone/camera access if prompted."
                      : "Please check your connection and try joining again."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <StatusPill tone={audioMuted ? "warning" : "success"}>
                      {audioMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                      {audioMuted ? "Mic muted" : "Mic ready"}
                    </StatusPill>
                    <StatusPill tone={videoMuted ? "warning" : "success"}>
                      {videoMuted ? <VideoOff className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      {call.video ? (videoMuted ? "Camera off" : "Camera ready") : "Audio session"}
                    </StatusPill>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[75%] flex-col gap-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#0B3D2E]/75 px-3 py-1.5 text-xs text-[#DCEDE3] backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#2E8B57] shadow-[0_0_0_4px_rgba(46,139,87,0.18)]" />
                {participantName}
              </div>
              {videoMuted ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
                  <VideoOff className="h-3.5 w-3.5" />
                  Camera is off
                </div>
              ) : null}
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-wrap gap-2">
              <StatusPill tone={audioMuted ? "warning" : "success"}>
                {audioMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {audioMuted ? "Muted" : "Mic on"}
              </StatusPill>
              <StatusPill tone={videoMuted ? "warning" : "success"}>
                {videoMuted ? <VideoOff className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                {videoMuted ? "Camera off" : "Camera on"}
              </StatusPill>
              <StatusPill>
                <ShieldCheck className="h-3 w-3" />
                Secure session
              </StatusPill>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#F5F9F6] px-2 py-2.5 sm:px-3 sm:py-3">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-2 sm:gap-3">
              <ControlButton
                active={!audioMuted}
                label={audioMuted ? "Unmute microphone" : "Mute microphone"}
                title={audioMuted ? "Unmute microphone" : "Mute microphone"}
                onClick={toggleAudio}
              >
                {audioMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
              </ControlButton>
              <ControlButton
                active={!videoMuted}
                label={videoMuted ? "Turn camera on" : "Turn camera off"}
                title={videoMuted ? "Turn camera on" : "Turn camera off"}
                onClick={toggleVideo}
              >
                {videoMuted ? <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Video className="h-4 w-4 sm:h-5 sm:w-5" />}
              </ControlButton>
              <ControlButton
                label="Share screen"
                title="Share screen (availability depends on browser and call service)"
                onClick={toggleShare}
                active={false}
              >
                <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </ControlButton>
              <ControlButton
                disabled
                label="Speaker controls unavailable"
                title="Speaker controls are managed by your device/browser in this call"
              >
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </ControlButton>
              <ControlButton danger label="End call" title="End call" onClick={hangup}>
                <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              </ControlButton>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#52665B]">
              Screen sharing and speaker controls depend on browser/call-service support. Unsupported controls are shown as unavailable.
            </p>
          </div>
        </div>

        {showInfo ? (
          <aside className="max-h-[42%] min-h-0 w-full overflow-y-auto border-t border-white/10 bg-[#F5F9F6] p-3 text-[#163D30] sm:p-4 lg:max-h-none lg:w-[320px] lg:border-l lg:border-t-0 xl:w-[360px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#163D30] sm:text-base">Session Information</h3>
              <span className="rounded-full border border-[#2E8B57]/20 bg-[#DDF3E5] px-2.5 py-1 text-[11px] font-medium text-[#145A43]">
                {status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#d9e8de] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82948A]">Participants</p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF3E5] text-[#145A43] ring-1 ring-[#2E8B57]/15">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#163D30]">{details?.participantLabel || "Participant"}</p>
                      <p className="truncate text-sm text-[#52665B]">{participantName}</p>
                    </div>
                  </div>
                  {counterpartName ? (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF3E5] text-[#145A43] ring-1 ring-[#2E8B57]/15">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#163D30]">{details?.counterpartRole === "student" ? "Student" : details?.counterpartRole === "counselor" ? "Counselor" : "Participant"}</p>
                        <p className="truncate text-sm text-[#52665B]">{counterpartName}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d9e8de] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82948A]">Session details</p>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#237A52]" />
                    <div>
                      <p className="font-medium text-[#163D30]">Date & time</p>
                      <p className="text-[#52665B]">{scheduledText || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock3 className="mt-0.5 h-4 w-4 text-[#237A52]" />
                    <div>
                      <p className="font-medium text-[#163D30]">Duration</p>
                      <p className="text-[#52665B]">{details?.durationLabel || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-[#237A52]" />
                    <div>
                      <p className="font-medium text-[#163D30]">Type & status</p>
                      <p className="text-[#52665B]">{sessionType} · {status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d9e8de] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82948A]">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#52665B]">
                  {details?.notes?.trim() ? details.notes : "No session notes available for this call view."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#bfe0cc] bg-[#DDF3E5] p-3 text-sm text-[#145A43] sm:p-4">
                <p className="font-medium">MindWell secure call</p>
                <p className="mt-1 text-[#1B6B50]">This in-app call uses the existing secure meeting service. Audio/video controls here send commands to the active session when supported.</p>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setShowInfo((v) => !v)}
        className="inline-flex items-center justify-center gap-2 border-t border-white/10 bg-[#145A43] px-3 py-2 text-xs font-medium text-white hover:bg-[#1B6B50] sm:hidden"
      >
        <Info className="h-4 w-4" />
        {showInfo ? "Hide session details" : "Show session details"}
      </button>
    </div>
  );
}
