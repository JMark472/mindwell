import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Card, Button } from "@/components/ui/Primitives";
import { getResource, type WellnessResource } from "@/api/wellness";

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState<WellnessResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getResource(slug)
      .then(setResource)
      .catch(() => setError("Resource not found or not published."));
  }, [slug]);

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold">Not available</h2>
        <p className="mt-1 text-sm text-ink-400">{error}</p>
        <Button asChild className="mt-4">
          <Link to="/student/resources">Back to resources</Link>
        </Button>
      </Card>
    );
  }

  if (!resource) {
    return <p className="text-sm text-ink-400">Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" className="self-start px-0">
        <Link to="/student/resources">← Back to resources</Link>
      </Button>
      <Card className="p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
          {resource.category?.name}
        </p>
        <h1 className="mt-2 text-heading font-semibold">{resource.title}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {resource.reading_minutes} min read
          {resource.published_at
            ? ` • Updated ${new Date(resource.published_at).toLocaleDateString("en-PH")}`
            : ""}
        </p>
        <article className="prose prose-sm mt-6 max-w-none text-ink">
          <p>{resource.excerpt}</p>
          <div className="whitespace-pre-wrap leading-relaxed">{resource.body}</div>
        </article>
        <div className="mt-8 rounded-field bg-mint-soft p-4 text-sm">
          <p className="font-medium">Try this today</p>
          <p className="mt-1 text-ink-600">
            Take a slow breath and try one small action suggested in this article.
          </p>
        </div>
      </Card>
    </div>
  );
}
