import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Card, Button, Badge } from "@/components/ui/Primitives";
import { getResource, type WellnessResource } from "@/api/wellness";
import { Clock3 } from "lucide-react";
import { ResourceCover } from "@/components/ui/ResourceCover";

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/counselor") ? "/counselor/resources" : "/student/resources";
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
          <Link to={basePath}>Back to resources</Link>
        </Button>
      </Card>
    );
  }

  if (!resource) {
    return <p className="text-sm text-ink-400">Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Button asChild variant="ghost" className="self-start px-0">
        <Link to={basePath}>← Back to resources</Link>
      </Button>
      <Card className="overflow-hidden">
        <div className="relative h-56 w-full sm:h-72 md:h-80">
          <ResourceCover src={resource.cover_image} alt={resource.title} title={resource.title} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
            {resource.category?.name ? <Badge tone="teal" className="bg-white/90 text-navy ring-1 ring-white/40">{resource.category.name}</Badge> : null}
            <span className="inline-flex items-center gap-1 rounded-pill bg-black/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Clock3 className="h-3.5 w-3.5" /> {resource.reading_minutes ?? 3} min read
            </span>
            {resource.is_featured ? <Badge tone="warning" className="bg-white/90 text-navy ring-1 ring-white/40">Featured</Badge> : null}
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{resource.title}</h1>
          <p className="mt-2 text-sm text-ink-400">
            {resource.published_at
              ? `Updated ${new Date(resource.published_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`
              : "Wellness guide"}
          </p>
          <article className="prose prose-sm mt-6 max-w-none text-ink">
            <p className="text-base leading-relaxed text-ink-600">{resource.excerpt}</p>
            <div className="mt-4 whitespace-pre-wrap leading-relaxed text-ink-600">{resource.body}</div>
          </article>
          <div className="mt-8 rounded-[20px] border border-teal/20 bg-gradient-to-r from-mint-soft/80 to-white p-4 text-sm">
            <p className="font-medium text-navy">Try this today</p>
            <p className="mt-1 text-ink-600">
              Take a slow breath and try one small action suggested in this article.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
