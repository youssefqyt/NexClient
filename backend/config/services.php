<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Assistant
    |--------------------------------------------------------------------------
    | Provider-agnostic configuration used by App\Services\AiService. When
    | "api_key" is empty the assistant degrades gracefully to offline mode.
    | Supports Groq, OpenAI, Anthropic, and OpenRouter.
    */

    'ai' => [
        'provider' => env('AI_PROVIDER', 'groq'),
        'api_key' => env('GROQ_API_KEY') ?: (env('AI_API_KEY') ?: env('OPENAI_API_KEY')),
        'model' => env('AI_MODEL', env('AI_PROVIDER', 'groq') === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'),
        'base_url' => env('AI_BASE_URL', env('AI_PROVIDER', 'groq') === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'),
    ],

];
