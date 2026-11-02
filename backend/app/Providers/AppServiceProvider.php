<?php

namespace App\Providers;

use App\Mail\ResendHttpTransport;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
            return "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($notifiable->getEmailForPasswordReset());
        });

        // Native Resend HTTP API transport (bypasses blocked SMTP ports on cloud hosts)
        Mail::extend('resend', function (array $config = []) {
            $key = $config['key'] ?? env('RESEND_KEY', env('MAIL_PASSWORD'));
            return new ResendHttpTransport($key);
        });
    }
}


