import type { LucideIcon } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";
import { cn } from "@/utils/cn";

/**
 * Shared, readable hero used by role dashboards and settings pages.
 * Uses solid light-mint surfaces and readable heading/body colors.
 */
export default function DashboardHero({
  eyebrow,
  greeting,
  title,
  description,
  avatar,
  icon: Icon,
  actions,
  className,
}: {
  eyebrow: string;
  greeting?: string;
  title: string;
  description: string;
  avatar?: { name: string; url?: string | null };
  icon: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-[#D7ECE6] bg-gradient-to-br from-[#E8F7F3] via-[#F3FBF8] to-[#DFF5EE] p-4 shadow-card sm:p-7 lg:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-secondary/10 sm:h-56 sm:w-56" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-primary/10 sm:h-56 sm:w-56" />
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-5 hidden h-10 w-10 text-primary/15 sm:block"
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#BFE7DD] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {avatar ? (
              <UserAvatar
                user={{ fullName: avatar.name, avatarUrl: avatar.url ?? null }}
                size="lg"
                className="h-14 w-14 shrink-0 border-2 border-white shadow-card sm:h-20 sm:w-20"
              />
            ) : null}
            <div className="min-w-0">
              {greeting ? <p className="text-xs font-medium text-body sm:text-sm">{greeting}</p> : null}
              <h2 className="mt-0.5 text-lg font-semibold leading-tight tracking-tight text-heading sm:text-2xl lg:text-3xl">
                {title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-body sm:mt-2 sm:text-sm lg:text-base">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
