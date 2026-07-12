<?php

return [
    'default' => 'reverb',

    'apps' => [
        'reverb' => [
            'key' => env('REVERB_APP_KEY', 'azkala-key'),
            'secret' => env('REVERB_APP_SECRET', 'azkala-secret'),
            'app_id' => env('REVERB_APP_ID', 'azkala-app'),
            'options' => [
                'host' => env('REVERB_HOST', '127.0.0.1'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => 'http',
                'useTLS' => false,
            ],
            'allowed_origins' => ['*'],
            'ping_interval' => 60,
            'max_request_size' => 10_000,
        ],
    ],
];