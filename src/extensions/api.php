<?php

use Kirby\Cms\App;
use Kirby\Exception\AuthException;
use Kirby\Exception\LogicException;
use Kirby\Exception\BadMethodCallException;
use Kirby\Http\Remote;

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
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__content-translator__/translate',
            'method' => 'POST',
            'action' => function () use ($kirby, $SUPPORTED_SOURCE_LANGUAGES) {
                $request = $kirby->request();
                $text = $request->get('text');
                $sourceLanguage = $request->get('sourceLanguage');
                $targetLanguage = $request->get('targetLanguage');

                if (!$text || !$targetLanguage) {
                    throw new BadMethodCallException('Missing required parameters');
                }

                $translateFn = $kirby->option('johannschopplich.content-translator.translateFn');

                if ($translateFn && is_callable($translateFn)) {
                    $result = $translateFn($text, $sourceLanguage, $targetLanguage);

                    return [
                        'text' => $result
                    ];
                }

                // Default to DeepL API
                $authKey = $kirby->option('johannschopplich.content-translator.DeepL.apiKey');
                $apiUrlFree = 'https://api-free.deepl.com/v2/translate';
                $apiUrlPro = 'https://api.deepl.com/v2/translate';
                $isAuthKeyFreeAccount = str_ends_with($authKey, ':fx');

                if (empty($authKey)) {
                    throw new AuthException('Missing DeepL API key');
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
                    throw new LogicException('Failed to translate text');
                }

                return [
                    'text' => $data['translations'][0]['text']
                ];
            }
        ]
    ]
];
