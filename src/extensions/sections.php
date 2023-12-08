<?php

use Kirby\Toolkit\I18n;

return [
    'content-translator' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label),
            'confirm' => fn ($confirm = true) => $confirm,
            'syncableFields' => fn ($syncableFields = null) => $syncableFields,
            'translatableFields' => fn ($translatableFields = null) => $translatableFields,
            'translatableBlocks' => fn ($translatableBlocks = null) => $translatableBlocks
        ],
        'computed' => [
            'config' => function () {
                /** @var \Kirby\Cms\App $kirby */
                $kirby = $this->kirby();
                $config = $kirby->option('johannschopplich.content-translator', []);

                // Set default values
                $config['translatableBlocks'] ??= [
                    'gallery' => ['caption'],
                    'heading' => ['text'],
                    'image' => ['alt', 'caption'],
                    'list' => ['text'],
                    'markdown' => ['text'],
                    'quote' => ['text', 'citation'],
                    'text' => ['text'],
                    'video' => ['caption']
                ];

                // Check if `apiKey` is set, but don't return it for security reasons
                if (isset($config['DeepL']['apiKey'])) {
                    $config['DeepL']['apiKey'] = !empty($config['DeepL']['apiKey']);
                }

                return $config;
            }
        ]
    ],
    'serp-preview' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label)
        ],
        'computed' => [
            'config' => function () {
                /** @var \Kirby\Cms\App $kirby */
                $kirby = $this->kirby();

                return $kirby->option('johannschopplich.serp-preview', [
                    'title' => $kirby->site()->title()->value(),
                    'url' => $kirby->site()->url()
                ]);
            }
        ]
    ]
];
