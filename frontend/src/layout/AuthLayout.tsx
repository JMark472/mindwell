import { Card } from "@/components/ui/Primitives";
import { NavLink, Outlet } from "react-router";

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mint-soft via-canvas to-sky px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Mindwell" className="mb-3 h-12 w-12 rounded-field object-cover" />
          <p className="text-sm font-semibold">Mindwell</p>
          <p className="text-xs text-ink-400">
            Student mental wellness &amp; counseling support
          </p>
        </div>
        <Card className="p-8 shadow-lift">{children ?? <Outlet />}</Card>
        <p className="mt-6 text-center text-xs text-ink-400">
          Mindwell is not a replacement for professional mental health care and is
          not an emergency response service.
        </p>
        <p className="mt-3 text-center text-xs">
          <NavLink to="/help" className="font-medium text-teal hover:underline">
            Need urgent help? View crisis resources
          </NavLink>
        </p>
      </div>
    </div>
  );
}
