import { Link } from "react-router";
import { Button } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";

export default function SessionExpiredPage() {
  return (
    <div>
      <h1 className="text-heading font-semibold">Session expired</h1>
      <p className="mt-1 text-sm text-ink-400">
        Your session timed out for your security.
      </p>
      <Alert className="mt-4">
        Your session timed out for your security. Sign in again to continue.
      </Alert>
      <Button asChild className="mt-6 w-full">
        <Link to="/signin">Sign in again</Link>
      </Button>
    </div>
  );
}
