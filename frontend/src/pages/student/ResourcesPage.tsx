import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Card, Badge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listResources, type WellnessResource } from "@/api/wellness";
import { ResourceCover } from "@/components/ui/ResourceCover";
import { Clock3, ArrowRight } from "lucide-react";

export default function ResourcesPage() {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/counselor") ? "/counselor/resources" : "/student/resources";
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
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="min-h-11 w-full min-w-0 rounded-field border border-line/80 bg-white/80 px-3 text-base md:max-w-sm sm:text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActive(null)}
              className={`min-h-11 rounded-pill px-4 py-2 text-sm transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 ${
                active === null ? "bg-mint-soft text-navy ring-1 ring-teal/20" : "border border-line bg-white/70 hover:bg-white"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActive(category.slug)}
                className={`min-h-11 rounded-pill px-4 py-2 text-sm transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 ${
                  active === category.slug
                    ? "bg-mint-soft text-navy ring-1 ring-teal/20"
                    : "border border-line bg-white/70 hover:bg-white"
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
            <Card key={resource.id} hover className="group overflow-hidden p-0">
              <Link to={`${basePath}/${resource.slug}`} className="flex h-full flex-col">
                <div className="relative h-44 w-full overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                    <ResourceCover src={resource.cover_image} alt={resource.title} title={resource.title} />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/20 via-transparent to-transparent opacity-80" />
                  {resource.is_featured ? (
                    <div className="absolute left-3 top-3">
                      <Badge tone="warning" className="bg-white/90 text-navy ring-1 ring-white/50">Featured</Badge>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[11px] uppercase tracking-[0.14em] text-ink-300 sm:tracking-[0.18em]">
                      {resource.category?.name ?? "Resource"}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-400">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" /> {resource.reading_minutes ?? 3} min
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-ink group-hover:text-teal-700 transition-colors">{resource.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-400 line-clamp-3">{resource.excerpt}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal">
                    Open resource <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
