<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    AiController,
    ActivityLogController,
    ClientController,
    ProjectController,
    TaskController,
    InvoiceController,
    SupportTicketController,
    NotificationController,
    AnalyticsController,
    SettingController,
    BlogPostController,
    ContactController,
    UserController
};

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
| Public form + auth endpoints are rate-limited to blunt brute-force and
| spam on the contact form.
*/
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');

// Public marketing content
Route::get('/blog', [BlogPostController::class, 'index']);
Route::get('/blog/{id}', [BlogPostController::class, 'show']);
Route::get('/settings/public', [SettingController::class, 'public']);
Route::get('/ai/status', [AiController::class, 'status']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth / account
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::get('/profile', [UserController::class, 'me']);
    Route::put('/profile', [UserController::class, 'updateMe']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])->middleware('throttle:6,1');

    // Users (lookup routes must precede the resource route)
    Route::get('/users/assignable', [UserController::class, 'assignable']);

    // Analytics
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/analytics/revenue', [AnalyticsController::class, 'revenue']);
    Route::get('/analytics/tasks', [AnalyticsController::class, 'tasks']);
    Route::get('/analytics/clients', [AnalyticsController::class, 'clients']);

    // AI assistant
    Route::post('/ai/summarize-project', [AiController::class, 'summarizeProject']);
    Route::post('/ai/status-update', [AiController::class, 'statusUpdate']);
    Route::post('/ai/task-breakdown', [AiController::class, 'taskBreakdown']);
    Route::post('/ai/draft-message', [AiController::class, 'draftMessage']);
    Route::post('/ai/chat', [AiController::class, 'chat']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Clients
    Route::get('/clients/companies', [ClientController::class, 'companies']);
    Route::post('/clients/companies', [ClientController::class, 'storeCompany']);
    Route::apiResource('clients', ClientController::class);

    // Projects
    Route::get('/projects/{id}/activity', [ProjectController::class, 'activity']);
    Route::post('/projects/{id}/milestones', [ProjectController::class, 'storeMilestone']);
    Route::put('/projects/{id}/milestones/{milestoneId}', [ProjectController::class, 'updateMilestone']);
    Route::delete('/projects/{id}/milestones/{milestoneId}', [ProjectController::class, 'destroyMilestone']);
    Route::apiResource('projects', ProjectController::class);

    // Tasks
    Route::put('/tasks/reorder', [TaskController::class, 'reorder']);
    Route::post('/tasks/{id}/comments', [TaskController::class, 'storeComment']);
    Route::delete('/tasks/{id}/comments/{commentId}', [TaskController::class, 'destroyComment']);
    Route::post('/tasks/{id}/attachments', [TaskController::class, 'storeAttachment']);
    Route::delete('/tasks/{id}/attachments/{attachmentId}', [TaskController::class, 'destroyAttachment']);
    Route::apiResource('tasks', TaskController::class);

    // Invoices
    Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    Route::post('/invoices/{id}/payments', [InvoiceController::class, 'recordPayment']);
    Route::apiResource('invoices', InvoiceController::class);

    // Support tickets
    Route::post('/tickets/{id}/messages', [SupportTicketController::class, 'addMessage']);
    Route::apiResource('tickets', SupportTicketController::class);

    /*
    |----------------------------------------------------------------------
    | Admin-only routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        // Users management (status/role actions must precede the resource route)
        Route::put('/users/{id}/status', [UserController::class, 'toggleStatus']);
        Route::put('/users/{id}/role', [UserController::class, 'changeRole']);
        Route::apiResource('users', UserController::class);

        // Activity log
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);

        // Settings
        Route::get('/settings', [SettingController::class, 'index']);
        Route::get('/settings/{key}', [SettingController::class, 'show']);
        Route::put('/settings/{key}', [SettingController::class, 'update']);
        Route::post('/settings/bulk', [SettingController::class, 'bulkUpdate']);

        // Blog management
        Route::post('/blog', [BlogPostController::class, 'store']);
        Route::put('/blog/{id}', [BlogPostController::class, 'update']);
        Route::delete('/blog/{id}', [BlogPostController::class, 'destroy']);

        // Contact messages management
        Route::get('/contact-messages', [ContactController::class, 'index']);
        Route::get('/contact-messages/{id}', [ContactController::class, 'show']);
        Route::put('/contact-messages/{id}/status', [ContactController::class, 'updateStatus']);
    });
});
