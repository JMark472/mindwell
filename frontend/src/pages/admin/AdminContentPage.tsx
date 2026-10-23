import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { listResources, createResource, archiveResource } from "@/api/wellness";
import { errorMessage } from "@/api/client";

export default function AdminContentPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    body: "",
    wellness_category_id: 1,
    status: "published",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const result = await listResources({ status: "all" });
    setResources(result.resources ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setError(null);
    try {
      await createResource(form);
      setForm({ title: "", excerpt: "", body: "", wellness_category_id: 1, status: "published" });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create resource."));
    }
  }

  async function archive(id: number) {
    await archiveResource(id);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Create resource</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-10 rounded-field border border-line px-3 text-sm"
          />
          <input
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="h-10 rounded-field border border-line px-3 text-sm"
          />
          <textarea
            placeholder="Body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={4}
            className="rounded-field border border-line px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button className="mt-3" onClick={() => void create()}>
          Publish resource
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold">Resources</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy-050">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium">Title</th>
              <th className="px-6 py-2 text-left text-xs font-medium">Status</th>
              <th className="px-6 py-2 text-right text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td className="px-6 py-3">{resource.title}</td>
                <td className="px-6 py-3 capitalize">{resource.status}</td>
                <td className="px-6 py-3 text-right">
                  {resource.status !== "archived" ? (
                    <button onClick={() => void archive(resource.id)} className="text-xs text-danger">
                      Archive
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
