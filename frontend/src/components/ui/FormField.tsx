import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Consistent form field wrapper used by forms across the application.
 * Pass a render prop to automatically connect the control to its label.
 */
export default function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children:
    | React.ReactNode
    | ((props: {
        id: string;
        "aria-describedby"?: string;
        "aria-invalid": boolean;
      }) => React.ReactNode);
}) {
  const generatedId = useId();
  const id = `mw-field-${generatedId.replace(/:/g, "")}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
        {required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
      </label>
      {typeof children === "function"
        ? children({
            id,
            "aria-describedby": describedBy || undefined,
            "aria-invalid": Boolean(error),
          })
        : children}
      {hint ? (
        <p id={hintId} className="text-xs leading-snug text-body">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
