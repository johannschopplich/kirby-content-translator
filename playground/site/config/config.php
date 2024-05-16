<?php

return [
    'debug' => true,

    'languages' => true,

    'content' => [
        'locking' => false
    ],

    'johannschopplich.content-translator' => [
        'DeepL' => [
            'apiKey' => env('DEEPL_API_KEY')
        ]
    ]
];
