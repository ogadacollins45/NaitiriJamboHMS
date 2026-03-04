<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://chidstal-hmsv-2.vercel.app',
        'http://localhost:5173',
        'brixtonmakunga.com',
        'https://brixtonmakunga.com',
        'www.brixtonmakunga.com',
        'https://www.brixtonmakunga.com'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
