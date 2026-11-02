<?php

namespace App\Services;

use App\Models\Notification;

/**
 * Creates in-app notifications. Kept intentionally tiny so it can later be
 * swapped for a queued / broadcast implementation without touching callers.
 */
class NotificationService
{
    public function notify(?int $userId, string $type, string $title, string $message, array $data = []): ?Notification
    {
        if (! $userId) {
            return null;
        }

        try {
            return Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data ?: null,
            ]);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function notifyMany(array $userIds, string $type, string $title, string $message, array $data = []): void
    {
        foreach (array_unique(array_filter($userIds)) as $id) {
            $this->notify((int) $id, $type, $title, $message, $data);
        }
    }
}
