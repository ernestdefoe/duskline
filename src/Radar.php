<?php

/*
 * This file is part of ernestdefoe/duskline.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace ErnestDefoe\Duskline;

use Carbon\Carbon;
use Flarum\Http\SlugManager;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Who is online, for the radar widget. Only members who show their online
 * status are counted or shown. The shared part (a count and up to DOTS ids)
 * is cached for CACHE_SECONDS; who an actor may see is decided per request.
 */
final class Radar
{
    /** Faces on the radar. */
    public const DOTS = 12;

    /** "Online" means seen within this many minutes. */
    public const WINDOW_MINUTES = 5;

    /** Recent members scanned for their online-status preference (the count tops out here). */
    public const SCAN = 200;

    public const CACHE_SECONDS = 60;

    public function __construct(protected Cache $cache, protected SlugManager $slugs)
    {
    }

    /** @return array{count: int, ids: list<int>} */
    public function shared(): array
    {
        return $this->cache->remember('duskline.radar', self::CACHE_SECONDS, function (): array {
            $count = 0;
            $ids = [];
            $recent = User::query()
                ->where('last_seen_at', '>', Carbon::now()->subMinutes(self::WINDOW_MINUTES))
                ->where('is_email_confirmed', true)
                ->orderByDesc('last_seen_at')
                ->limit(self::SCAN)
                ->get(['id', 'preferences']);

            foreach ($recent as $user) {
                if (! $user->getPreference('discloseOnline')) {
                    continue;
                }
                $count++;
                if (count($ids) < self::DOTS) {
                    $ids[] = (int) $user->id;
                }
            }

            return ['count' => $count, 'ids' => $ids];
        });
    }

    /**
     * The radar as this actor may see it: nothing without forum access, the
     * count for everyone else, faces only for members allowed to search users
     * and only of users visible to them (one query by primary key).
     *
     * @return array{count: int, users: list<array{id: int, username: string, slug: string, displayName: string, avatarUrl: ?string}>}|null
     */
    public function for(User $actor): ?array
    {
        if (! $actor->can('viewForum')) {
            return null;
        }

        $shared = $this->shared();
        $users = [];

        if ($shared['ids'] && $actor->can('searchUsers')) {
            $found = User::whereVisibleTo($actor)->whereIn('id', $shared['ids'])->get()->keyBy('id');
            $driver = $this->slugs->forResource(User::class);
            foreach ($shared['ids'] as $id) {
                if ($user = $found->get($id)) {
                    $users[] = [
                        'id' => $id,
                        'username' => (string) $user->username,
                        'slug' => $driver->toSlug($user),
                        'displayName' => (string) $user->display_name,
                        'avatarUrl' => $user->avatar_url,
                    ];
                }
            }
        }

        return ['count' => $shared['count'], 'users' => $users];
    }
}
