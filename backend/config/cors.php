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

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [
        'Content-Disposition', // Required for CSV file downloads to work
    ],

    'max_age' => 86400, // Cache preflight for 24 hours

    'supports_credentials' => true,

];
