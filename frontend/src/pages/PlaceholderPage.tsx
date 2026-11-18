import { Card, IconBadge, Badge } from "@/components/ui/Primitives";
import { Sparkles, Info } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card className="relative overflow-hidden p-8 text-center">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-mint/15 blur-3xl" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
        <IconBadge icon={Sparkles} tone="teal" />
        <Badge tone="info" className="mt-4"><Info className="mr-1 h-3 w-3" /> In progress</Badge>
        <h2 className="mt-3 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-ink-400">
          This screen is available in the prototype. Core workflows are implemented across the platform, and additional details or actions for this area may be expanded here.
        </p>
      </div>
    </Card>
  );
}
