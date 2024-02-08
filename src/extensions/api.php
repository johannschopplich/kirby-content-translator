<?php

use Kirby\Http\Remote;
use Kirby\Http\Response;

$SUPPORTED_SOURCE_LANGUAGES = [
    'AR',
    'BG',
    'CS',
    'DA',
    'DE',
    'EL',
    'EN',
    'ES',
    'ET',
    'FI',
    'FR',
    'HU',
    'ID',
    'IT',
    'JA',
    'KO',
    'LT',
    'LV',
    'NB',
    'NL',
    'PL',
    'PT',
    'RO',
    'RU',
    'SK',
    'SL',
    'SV',
    'TR',
    'UK',
    'ZH'
];


return [
    'routes' => fn (\Kirby\Cms\App $kirby) => [
        [
            'pattern' => '__content-translator__/translate',
            'method' => 'POST',
            'action' => function () use ($kirby, $SUPPORTED_SOURCE_LANGUAGES) {
                $request = $kirby->request();
                $text = $request->get('text');
                $sourceLanguage = $request->get('sourceLanguage');
                $targetLanguage = $request->get('targetLanguage');

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

                if (!empty($sourceLanguage)) {
                    $sourceLanguage = strtoupper($sourceLanguage);

                    if (!in_array($sourceLanguage, $SUPPORTED_SOURCE_LANGUAGES, true)) {
                        $sourceLanguage = null;
                    }
                }

                $response = Remote::request($isAuthKeyFreeAccount ? $apiUrlFree : $apiUrlPro, [
                    'method' => 'POST',
                    'headers' => [
                        'Authorization' => 'DeepL-Auth-Key ' . $authKey,
                        'Content-Type' => 'application/json'
                    ],
                    'data' => json_encode([
                        'text' => [$text],
                        'source_lang' => $sourceLanguage,
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
