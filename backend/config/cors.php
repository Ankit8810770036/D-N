<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | In development:  FRONTEND_URL=http://localhost:5173
    | In production:   FRONTEND_URL=https://yourclientdomain.com
    |
    | IMPORTANT: Set FRONTEND_URL correctly in the production .env file
    | before handing over to the client. Never use '*' in production.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Disposition',
    ],

    'max_age' => 86400,

    'supports_credentials' => false,

];
