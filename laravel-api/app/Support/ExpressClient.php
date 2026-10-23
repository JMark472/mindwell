<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client for the Express service (the owner of identity, notifications,
 * audit logs and system settings).
 *
 * All calls are authenticated with the shared service key, which never
 * leaves the server.
 */
class ExpressClient
{
    private static array $nameCache = [];

    public static function baseUrl(): string
    {
        return rtrim((string) config('mindwell.express_url'), '/');
    }

    /**
     * Fetches minimal user projections (id, name, role, status).
     *
     * @param  array<int,int>  $ids
     * @return array<int, array{id:int,full_name:string,role:string,status:string}>
     */
    public static function lookupUsers(array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        if ($ids === []) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'X-Service-Key' => (string) config('mindwell.service_key'),
                'Accept' => 'application/json',
            ])->timeout(5)->post(self::baseUrl() . '/api/internal/users/lookup', [
                'ids' => $ids,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Express user lookup failed: ' . $e->getMessage());

            return [];
        }

        if (! $response->successful()) {
            return [];
        }

        $rows = $response->json('data.users') ?? [];
        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row['id']] = [
                'id' => (int) $row['id'],
                'full_name' => (string) $row['fullName'],
                'role' => (string) $row['role'],
                'status' => (string) $row['status'],
            ];
        }

        return $map;
    }

    public static function userName(int $userId): ?string
    {
        if (isset(self::$nameCache[$userId])) {
            return self::$nameCache[$userId];
        }

        $users = self::lookupUsers([$userId]);
        $name = $users[$userId]['full_name'] ?? null;
        self::$nameCache[$userId] = $name;

        return $name;
    }

    /**
     * Creates user-facing notifications through the Express service.
     *
     * @param  array<int, array{user_id:int,type:string,title:string,body:string,link?:string}>  $notifications
     */
    public static function notify(array $notifications): bool
    {
        if ($notifications === []) {
            return true;
        }

        $payload = array_map(static fn (array $n): array => [
            'userId' => (int) $n['user_id'],
            'type' => $n['type'],
            'title' => $n['title'],
            'body' => $n['body'],
            'link' => $n['link'] ?? null,
        ], $notifications);

        try {
            $response = Http::withHeaders([
                'X-Service-Key' => (string) config('mindwell.service_key'),
                'Accept' => 'application/json',
            ])->timeout(5)->post(self::baseUrl() . '/api/internal/notifications', [
                'notifications' => $payload,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Express notification dispatch failed: ' . $e->getMessage());

            return false;
        }

        return $response->successful();
    }

    public static function flushCache(): void
    {
        self::$nameCache = [];
    }
}
