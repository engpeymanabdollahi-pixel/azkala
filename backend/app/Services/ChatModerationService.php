<?php

namespace App\Services;

use App\Models\BlockedUser;
use App\Models\ChatReport;
use App\Models\Conversation;
use Illuminate\Database\Eloquent\Collection;

class ChatModerationService
{
    public function getBlockedUsers(int $userId): Collection
    {
        return BlockedUser::with('blockedUser:id,name,avatar')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function blockUser(int $userId, int $blockedUserId, ?string $reason): BlockedUser
    {
        $blocked = BlockedUser::firstOrCreate([
            'user_id' => $userId,
            'blocked_user_id' => $blockedUserId,
        ], ['reason' => $reason]);

        Conversation::where(function ($query) use ($userId, $blockedUserId) {
            $query->where('buyer_id', $userId)->where('seller_id', $blockedUserId);
        })->orWhere(function ($query) use ($userId, $blockedUserId) {
            $query->where('buyer_id', $blockedUserId)->where('seller_id', $userId);
        })->update(['is_active' => false]);

        return $blocked;
    }

    public function unblockUser(int $userId, int $blockedUserId): bool
    {
        return (bool) BlockedUser::where('user_id', $userId)
            ->where('blocked_user_id', $blockedUserId)
            ->delete();
    }

    public function isBlocked(int $userId, int $blockedUserId): bool
    {
        return BlockedUser::where('user_id', $userId)
            ->where('blocked_user_id', $blockedUserId)
            ->exists();
    }

    public function reportUser(int $reporterId, array $data): ChatReport
    {
        return ChatReport::create([
            'reporter_id' => $reporterId,
            'reported_user_id' => $data['reported_user_id'],
            'conversation_id' => $data['conversation_id'] ?? null,
            'message_id' => $data['message_id'] ?? null,
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
        ]);
    }
}
