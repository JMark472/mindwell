<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WellnessCategory;
use App\Models\WellnessResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class WellnessResourceController extends Controller
{
    /**
     * GET /api/wellness-resources
     * Public library: only published resources are returned to students.
     */
    public function index(Request $request): JsonResponse
    {
        $role = (string) $request->attributes->get('auth_role');

        $query = WellnessResource::query()->with('category');

        if ($role !== 'admin') {
            $query->published();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->query('category')));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                    ->orWhere('excerpt', 'like', $search)
                    ->orWhere('body', 'like', $search);
            });
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $resources = $query->orderByDesc('published_at')->limit(100)->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'resources' => $resources,
                'categories' => WellnessCategory::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(),
            ],
        ]);
    }

    /**
     * GET /api/wellness-resources/{slug}
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $role = (string) $request->attributes->get('auth_role');
        $query = WellnessResource::query()->with('category')->where('slug', $slug);

        if ($role !== 'admin') {
            $query->published();
        }

        $resource = $query->firstOrFail();

        return response()->json(['status' => 'success', 'data' => ['resource' => $resource]]);
    }

    /**
     * POST /api/wellness-resources — admin only.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'wellness_category_id' => ['required', 'integer', 'exists:wellness_categories,id'],
            'title' => ['required', 'string', 'max:190'],
            'excerpt' => ['required', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'tags' => ['nullable', 'array'],
            'reading_minutes' => ['nullable', 'integer', 'min:1', 'max:120'],
            'status' => ['nullable', Rule::in([WellnessResource::STATUS_DRAFT, WellnessResource::STATUS_PUBLISHED, WellnessResource::STATUS_ARCHIVED])],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $validated['slug'] = $this->uniqueSlug($validated['title']);
        $validated['created_by_user_id'] = (int) $request->attributes->get('auth_user_id');
        $validated['status'] = $validated['status'] ?? WellnessResource::STATUS_DRAFT;
        if ($validated['status'] === WellnessResource::STATUS_PUBLISHED) {
            $validated['published_at'] = now();
        }

        $resource = WellnessResource::create($validated);

        return response()->json(['status' => 'success', 'data' => ['resource' => $resource]], 201);
    }

    /**
     * PATCH /api/wellness-resources/{id} — admin only.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $resource = WellnessResource::query()->findOrFail($id);

        $validated = $request->validate([
            'wellness_category_id' => ['sometimes', 'integer', 'exists:wellness_categories,id'],
            'title' => ['sometimes', 'string', 'max:190'],
            'excerpt' => ['sometimes', 'string', 'max:500'],
            'body' => ['sometimes', 'string'],
            'tags' => ['nullable', 'array'],
            'reading_minutes' => ['sometimes', 'integer', 'min:1', 'max:120'],
            'status' => ['sometimes', Rule::in([WellnessResource::STATUS_DRAFT, WellnessResource::STATUS_PUBLISHED, WellnessResource::STATUS_ARCHIVED])],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['title']) && $validated['title'] !== $resource->title) {
            $validated['slug'] = $this->uniqueSlug($validated['title'], $resource->id);
        }

        if (($validated['status'] ?? null) === WellnessResource::STATUS_PUBLISHED && ! $resource->published_at) {
            $validated['published_at'] = now();
        }

        $resource->update($validated);

        return response()->json(['status' => 'success', 'data' => ['resource' => $resource->fresh()]]);
    }

    /**
     * DELETE /api/wellness-resources/{id} — archive, never hard-delete.
     */
    public function destroy(int $id): JsonResponse
    {
        $resource = WellnessResource::query()->findOrFail($id);
        $resource->update(['status' => WellnessResource::STATUS_ARCHIVED]);

        return response()->json(['status' => 'success', 'data' => ['archived' => true]]);
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 2;

        while (WellnessResource::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
