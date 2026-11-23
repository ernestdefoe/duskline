<?php

/*
 * This file is part of ernestdefoe/duskline.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace ErnestDefoe\Duskline;

use Carbon\Carbon;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Who is online, for the radar widget: one cached answer for everyone, built
 * at most once a minute from two queries. Members who hide their online
 * status are counted but never shown.
 */
final class Radar
{
    public const DOTS = 12;

    public function __construct(protected Cache $cache)
    {
    }

    /** @return array{count: int, users: list<array{id: int, username: string, displayName: string, avatarUrl: ?string}>} */
    public function now(): array
    {
        return $this->cache->remember('duskline.radar', 60, function (): array {
            $since = Carbon::now()->subMinutes(5);
            $query = User::query()->where('last_seen_at', '>', $since);
            $count = (clone $query)->count();

            $users = [];
            foreach ($query->orderByDesc('last_seen_at')->limit(60)->get() as $user) {
                if (! $user->getPreference('discloseOnline')) {
                    continue;
                }
                $users[] = [
                    'id' => (int) $user->id,
                    'username' => (string) $user->username,
                    'displayName' => (string) $user->display_name,
                    'avatarUrl' => $user->avatar_url,
                ];
                if (count($users) >= self::DOTS) {
                    break;
                }
            }

            return ['count' => $count, 'users' => $users];
        });
    }
}
