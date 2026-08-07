<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'Azkala API Documentation',
                'description' => 'مستندات API فروشگاه ازکالا',
                'version' => '1.0.0',
            ],

            'routes' => [
                'api' => '/api/documentation',
            ],

            'paths' => [
                'use_absolute_path' => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),

                'docs' => storage_path('api-docs'),

                'views' => base_path('resources/views/vendor/l5-swagger'),
            ],
        ],
    ],
    'defaults' => [
        'routes' => [
            'docs' => '/api/documentation',
            'oauth2_callback' => '/api/oauth2-callback',
            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [],
                'oauth2_callback' => [],
            ],
        ],

        'paths' => [
            'annotations' => [
                base_path('app'),
                base_path('routes'),
            ],

            'docs' => storage_path('api-docs'),

            'views' => base_path('resources/views/vendor/l5-swagger'),
        ],

        'scan_options' => [
            'process_annotations' => true,
        ],

        'ui' => 'swagger-ui',
    ],
];
