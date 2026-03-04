<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://naitiri-jambo-v2.vercel.app',
        'http://localhost:5173',
        'naitirijambo.com',
        'https://naitirijambo.com',
        'www.naitirijambo.com',
        'https://www.naitirijambo.com'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
