import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/ui/Primitives";
import { listResources, createResource, archiveResource, type WellnessResource } from "@/api/wellness";
import { errorMessage } from "@/api/client";
import { ResourceCover } from "@/components/ui/ResourceCover";
import { Archive, Clock3, Image as ImageIcon, PlusCircle } from "lucide-react";

export default function AdminContentPage() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [categories, setCategories] = useState<Array<{ id?: number; slug: string; name: string }>>([]);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    body: "",
    wellness_category_id: 1,
    status: "published",
    cover_image: "",
    is_featured: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const result = await listResources({ status: "all" });
    setResources(result.resources ?? []);
    const cats = (result.categories ?? []).map((c: any) => ({ id: c.id, slug: c.slug, name: c.name }));
    setCategories(cats);
    if (cats[0]?.id && form.wellness_category_id === 1) {
      setForm((prev) => ({ ...prev, wellness_category_id: cats[0].id }));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError(null);
    setSaving(true);
    try {
      await createResource(form);
      setForm((prev) => ({ title: "", excerpt: "", body: "", wellness_category_id: prev.wellness_category_id || 1, status: "published", cover_image: "", is_featured: false }));
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create resource."));
    } finally {
      setSaving(false);
    }
  }

  async function archive(id: number) {
    await archiveResource(id);
    await load();
  }

  const statusTone = (status: string) => (status === "published" ? "success" : status === "archived" ? "neutral" : "warning");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">Create resource</h2>
          </div>
          <p className="mt-1 text-sm text-ink-400">Publish wellness resources with a cover image for student and counselor portals.</p>
          <div className="mt-4 grid gap-3">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-10 rounded-field border border-line/80 bg-white/80 px-3 text-sm"
            />
            <input
              placeholder="Excerpt"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="h-10 rounded-field border border-line/80 bg-white/80 px-3 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.wellness_category_id}
                onChange={(e) => setForm({ ...form, wellness_category_id: Number(e.target.value) })}
                className="h-10 rounded-field border border-line/80 bg-white/80 px-3 text-sm"
              >
                {categories.length === 0 ? <option value={1}>Category</option> : null}
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.id ?? 1}>{cat.name}</option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-10 rounded-field border border-line/80 bg-white/80 px-3 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                placeholder="Cover image URL (optional)"
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                className="h-10 w-full rounded-field border border-line/80 bg-white/80 pl-9 pr-3 text-sm"
              />
            </div>
            <textarea
              placeholder="Body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              className="rounded-field border border-line/80 bg-white/80 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Feature this resource
            </label>
          </div>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <Button className="mt-4" onClick={() => void create()} disabled={saving || !form.title.trim() || !form.excerpt.trim() || !form.body.trim()}>
            {saving ? "Saving…" : "Save resource"}
          </Button>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-line/70 px-6 py-4">
            <h3 className="text-base font-semibold">Cover image preview</h3>
            <p className="mt-1 text-sm text-ink-400">Preview how the resource card image will appear.</p>
          </div>
          <div className="p-6">
            <div className="overflow-hidden rounded-[20px] border border-line/70 bg-white/70 shadow-card">
              <div className="relative h-48 w-full">
                <ResourceCover src={form.cover_image || null} alt={form.title || "Resource cover preview"} title={form.title || "Resource cover preview"} />
                {form.is_featured ? <div className="absolute left-3 top-3"><Badge tone="warning" className="bg-white/90 text-navy ring-1 ring-white/50">Featured</Badge></div> : null}
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">{categories.find((c) => c.id === form.wellness_category_id)?.name ?? "Category"}</p>
                <p className="mt-1 font-semibold text-ink">{form.title || "Resource title"}</p>
                <p className="mt-1 text-sm text-ink-400 line-clamp-2">{form.excerpt || "Resource excerpt preview will appear here."}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Resources</h2>
            <p className="text-sm text-ink-400">Manage resource cards shown across student and counselor portals.</p>
          </div>
          <Badge tone="info">{resources.length} total</Badge>
        </div>
        {resources.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-400">No resources yet.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} hover className="group overflow-hidden p-0">
                <div className="flex h-full flex-col">
                  <div className="relative h-44 w-full overflow-hidden">
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                      <ResourceCover src={resource.cover_image} alt={resource.title} title={resource.title} />
                    </div>
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      <Badge tone={statusTone(resource.status) as any} className="bg-white/90 text-navy ring-1 ring-white/50 capitalize">{resource.status}</Badge>
                      {resource.is_featured ? <Badge tone="warning" className="bg-white/90 text-navy ring-1 ring-white/50">Featured</Badge> : null}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">{resource.category?.name ?? "Resource"}</p>
                    <h3 className="mt-2 text-base font-semibold text-ink">{resource.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-ink-400 line-clamp-3">{resource.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {resource.reading_minutes ?? 3} min read</span>
                      <span className="truncate">{resource.published_at ? new Date(resource.published_at).toLocaleDateString("en-PH") : "—"}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {resource.status !== "archived" ? (
                        <Button variant="secondary" size="sm" className="text-danger" onClick={() => void archive(resource.id)}>
                          <Archive className="h-4 w-4" /> Archive
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-400">Archived</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
