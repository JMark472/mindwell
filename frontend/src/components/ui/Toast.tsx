import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";

type ToastTone = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; tone: ToastTone; title: string; message?: string };

type ToastApi = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const icons = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;

let nextToastId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      const id = nextToastId++;
      setToasts((current) => [...current.slice(-3), { id, tone, title, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
      warning: (title, message) => push("warning", title, message),
      info: (title, message) => push("info", title, message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="mw-toast-viewport" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => {
            const Icon = icons[toast.tone];
            return (
              <div key={toast.id} className={cn("mw-toast", `mw-toast-${toast.tone}`)} role="status">
                <span className="mw-toast-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-heading">{toast.title}</p>
                  {toast.message ? (
                    <p className="mt-0.5 text-sm leading-snug text-body">{toast.message}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-body transition-colors hover:bg-black/5 hover:text-heading"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
