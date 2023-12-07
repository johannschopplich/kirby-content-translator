<?php

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

                if (!$translateFn || !is_callable($translateFn)) {
                    if (!class_exists(DeepL\Translator::class)) {
                        return Response::json([
                            'code' => 500,
                            'status' => 'Internal Server Error'
                        ], 500);
                    }

                    $authKey = $kirby->option('johannschopplich.content-translator.DeepL.apiKey');
                    $translator = new \DeepL\Translator($authKey);
                    $translateFn = fn ($text, $sourceLanguage, $targetLanguage) => $translator->translateText($text, null, $targetLanguage);
                }

                $result = $translateFn($text, $sourceLanguage, $targetLanguage);

                return Response::json([
                    'code' => 201,
                    'status' => 'Created',
                    'result' => [
                        'text' => $result->text
                    ]
                ], 201);
            }
        ]
    ]
];
