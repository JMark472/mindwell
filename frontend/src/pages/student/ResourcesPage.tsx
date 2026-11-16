import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Button } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listResources, type WellnessResource } from "@/api/wellness";

export default function ResourcesPage() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      listResources({ category: active ?? undefined, search: search || undefined })
        .then((result) => {
          setResources(result.resources);
          setCategories(result.categories.map((c) => ({ slug: c.slug, name: c.name })));
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [active, search]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="h-10 w-full rounded-field border border-line px-3 text-sm md:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActive(null)}
              className={`rounded-pill px-3 py-1 text-sm ${
                active === null ? "bg-mint-soft text-navy" : "border border-line"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActive(category.slug)}
                className={`rounded-pill px-3 py-1 text-sm ${
                  active === category.slug
                    ? "bg-mint-soft text-navy"
                    : "border border-line"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-ink-400">Loading resources…</p>
      ) : resources.length === 0 ? (
        <EmptyState
          title="No results"
          description="Try a different keyword or filter."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="flex flex-col overflow-hidden">
              {resource.cover_image ? (
                <img
                  src={resource.cover_image.startsWith("http") ? resource.cover_image : resource.cover_image}
                  alt={resource.title}
                  className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-teal/20 via-mint/10 to-navy-050">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-mint/30 blur-2xl" />
                  <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-teal/20 blur-2xl" />
                  <img src="/logo.png" alt="Mindwell" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-card" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
                  {resource.category?.name}
                </p>
                <h3 className="mt-2 text-base font-semibold">{resource.title}</h3>
                <p className="mt-2 flex-1 text-sm text-ink-400">{resource.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
                  <span>{resource.reading_minutes} min read</span>
                  <Button asChild variant="ghost" className="px-0">
                    <Link to={`/student/resources/${resource.slug}`}>Open →</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
