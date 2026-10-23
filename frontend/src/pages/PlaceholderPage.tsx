import { Card } from "@/components/ui/Primitives";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-400">
        This screen is available in the prototype. The core workflows are
        implemented above.
      </p>
    </Card>
  );
}
