import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold text-teal">404</p>
        <h1 className="mt-4 text-heading font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-ink-400">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-field bg-teal px-4 text-sm font-medium text-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
