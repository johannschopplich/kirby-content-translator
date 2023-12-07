<?php

use Kirby\Toolkit\I18n;

return [
    'content-translator' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label)
        ],
        'computed' => [
            'config' => fn () => option('johannschopplich.content-translator', [])
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
