import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

export const DROPDOWN_OPEN_EVENT = "mindwell:dropdown-open";
const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 8;
const MAX_MENU_HEIGHT = 384;

type DropdownOpenDetail = { id: string };

/** Let every menu in the app know another menu just opened. */
export function announceDropdownOpen(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DropdownOpenDetail>(DROPDOWN_OPEN_EVENT, { detail: { id } }));
}

type Position = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

/**
 * Shared click-away menu. The trigger stays inline, but the menu is portaled to
 * the body and positioned with fixed coordinates so no header/card/main
 * overflow or stacking context can clip it.
 */
export default function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  menuClassName,
  width = 256,
  ariaLabel = "Menu",
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    close: () => void;
    menuId: string;
  }) => React.ReactNode;
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
  width?: number;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `mw-dropdown-${useId()}`;

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  const updatePosition = useCallback(() => {
    const triggerEl = rootRef.current;
    const menuEl = menuRef.current;
    if (!triggerEl || !menuEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.max(160, Math.min(width, viewportWidth - VIEWPORT_MARGIN * 2));

    // Apply the final width before measuring so wrapped labels are accounted for.
    menuEl.style.width = `${menuWidth}px`;
    const contentHeight = menuEl.scrollHeight;

    const spaceBelow = viewportHeight - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_MARGIN;
    const fitsBelow = contentHeight <= Math.min(MAX_MENU_HEIGHT, spaceBelow);
    const placement: Position["placement"] =
      fitsBelow || spaceBelow >= spaceAbove ? "bottom" : "top";
    const available = Math.max(120, placement === "bottom" ? spaceBelow : spaceAbove);
    const maxHeight = Math.min(MAX_MENU_HEIGHT, available);
    const renderedHeight = Math.min(contentHeight, maxHeight);

    const preferredLeft = align === "right" ? rect.right - menuWidth : rect.left;
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportWidth - menuWidth - VIEWPORT_MARGIN),
    );
    const top =
      placement === "bottom"
        ? rect.bottom + TRIGGER_GAP
        : Math.max(VIEWPORT_MARGIN, rect.top - TRIGGER_GAP - renderedHeight);

    setPosition((current) =>
      current &&
      current.top === top &&
      current.left === left &&
      current.width === menuWidth &&
      current.maxHeight === maxHeight &&
      current.placement === placement
        ? current
        : { top, left, width: menuWidth, maxHeight, placement },
    );
  }, [align, width]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    announceDropdownOpen(menuId);

    function onOtherMenuOpen(event: Event) {
      const id = (event as CustomEvent<DropdownOpenDetail>).detail?.id;
      if (id && id !== menuId) setOpen(false);
    }

    window.addEventListener(DROPDOWN_OPEN_EVENT, onOtherMenuOpen);
    return () => window.removeEventListener(DROPDOWN_OPEN_EVENT, onOtherMenuOpen);
  }, [open, menuId]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      rootRef.current
        ?.querySelector<HTMLElement>("button, a, input, select, textarea, [tabindex]")
        ?.focus();
    }

    function onViewportChange() {
      updatePosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && menuRef.current
        ? new ResizeObserver(onViewportChange)
        : null;
    if (menuRef.current) resizeObserver?.observe(menuRef.current);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      resizeObserver?.disconnect();
    };
  }, [open, updatePosition]);

  return (
    <>
      <div ref={rootRef} className={cn("relative", className)}>
        {trigger({ open, toggle, close, menuId })}
      </div>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              tabIndex={-1}
              data-placement={position?.placement ?? "bottom"}
              className={cn("mw-dropdown mw-dropdown--portal", menuClassName)}
              style={{
                position: "fixed",
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                width: position?.width ?? Math.min(width, 296),
                maxHeight: position?.maxHeight ?? MAX_MENU_HEIGHT,
                zIndex: 80,
              }}
            >
              {typeof children === "function" ? children({ close }) : children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
