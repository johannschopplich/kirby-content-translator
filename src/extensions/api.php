<?php

use Kirby\Http\Remote;
use Kirby\Http\Response;

return [
    'routes' => fn (\Kirby\Cms\App $kirby) => [
        [
            'pattern' => '__content-translator__/translate',
            'method' => 'POST',
            'action' => function () use (&$kirby) {
                $body = $kirby->request()->body();
                $text = $body->get('text');
                $sourceLanguage = $body->get('sourceLanguage');
                $targetLanguage = $body->get('targetLanguage');

                if (!$text || !$targetLanguage) {
                    return Response::json([
                        'code' => 400,
                        'status' => 'Bad Request'
                    ], 400);
                }

                $translateFn = $kirby->option('johannschopplich.content-translator.translateFn');

                if ($translateFn && is_callable($translateFn)) {
                    $result = $translateFn($text, $sourceLanguage, $targetLanguage);

                    return Response::json([
                        'code' => 201,
                        'status' => 'Created',
                        'result' => [
                            'text' => $result
                        ]
                    ], 201);
                }

                // Default to DeepL API
                $authKey = $kirby->option('johannschopplich.content-translator.DeepL.apiKey');
                $apiUrlFree = 'https://api-free.deepl.com/v2/translate';
                $apiUrlPro = 'https://api.deepl.com/v2/translate';
                $isAuthKeyFreeAccount = str_ends_with($authKey, ':fx');

                if (empty($authKey)) {
                    return Response::json([
                        'code' => 500,
                        'status' => 'Internal Server Error'
                    ], 500);
                }

                $response = Remote::request($isAuthKeyFreeAccount ? $apiUrlFree : $apiUrlPro, [
                    'method' => 'POST',
                    'headers' => [
                        'Authorization' => 'DeepL-Auth-Key ' . $authKey,
                        'Content-Type' => 'application/json'
                    ],
                    'data' => json_encode([
                        'text' => [$text],
                        // 'source_lang' => strtoupper($sourceLanguage),
                        'target_lang' => strtoupper($targetLanguage)
                    ])
                ]);

                $data = $response->json();

                if ($response->code() !== 200 || !isset($data['translations'][0]['text'])) {
                    return Response::json([
                        'code' => 500,
                        'status' => 'Internal Server Error'
                    ], 500);
                }

                return Response::json([
                    'code' => 201,
                    'status' => 'Created',
                    'result' => [
                        'text' => $data['translations'][0]['text']
                    ]
                ], 201);
            }
        ]
    ]
];
