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
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Services
    |--------------------------------------------------------------------------
    */

    'sms' => [
        'provider' => env('SMS_PROVIDER', 'log'), // kavenegar, melipayamak, ghasedak, log
    ],

    'kavenegar' => [
        'api_key' => env('KAVENEGAR_API_KEY'),
    ],

    'melipayamak' => [
        'username' => env('MELIPAYAMAK_USERNAME'),
        'password' => env('MELIPAYAMAK_PASSWORD'),
        'from' => env('MELIPAYAMAK_FROM', '50005'),
    ],

    'ghasedak' => [
        'api_key' => env('GHASEDAK_API_KEY'),
    ],

];
