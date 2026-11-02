<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Records lightweight audit entries. Never throws — logging must not break a request.
 */
class ActivityLogger
{
    public function log(string $action, ?Model $subject = null, array $properties = []): ?ActivityLog
    {
        try {
            return ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'model_type' => $subject ? get_class($subject) : null,
                'model_id' => $subject?->getKey(),
                'properties' => $properties ?: null,
                'ip_address' => Request::ip(),
                'user_agent' => substr((string) Request::userAgent(), 0, 255),
            ]);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
