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

                return $kirby->option('johannschopplich.content-translator', []);
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
