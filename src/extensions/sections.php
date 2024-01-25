<?php

use Kirby\Toolkit\I18n;

return [
    'content-translator' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label),
            'confirm' => fn ($confirm = true) => $confirm,
            'syncableFields' => function ($syncableFields = null) {
                if (is_array($syncableFields)) {
                    return array_map('strtolower', $syncableFields);
                }

                return $syncableFields;
            },
            'translatableFields' => function ($translatableFields = null) {
                if (is_array($translatableFields)) {
                    return array_map('strtolower', $translatableFields);
                }

                return $translatableFields;
            },
            'translatableStructureFields' => function ($translatableStructureFields = null) {
                if (is_array($translatableStructureFields)) {
                    return array_map('strtolower', $translatableStructureFields);
                }

                return $translatableStructureFields;
            },
            'translatableBlocks' => function ($translatableBlocks = null) {
                if (is_array($translatableBlocks)) {
                    $translatableBlocks = array_change_key_case($translatableBlocks, CASE_LOWER);
                    foreach ($translatableBlocks as $block => $fields) {
                        if (!is_array($fields)) $fields = [$fields];
                        $translatableBlocks[$block] = array_map('strtolower', $fields);
                    }
                }

                return $translatableBlocks;
            }
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

                // Don't leak the API key to the Panel frontend
                if (isset($config['DeepL']['apiKey'])) {
                    $config['DeepL'] = [
                        'apiKey' => !empty($config['DeepL']['apiKey'])
                    ];
                }

                $config['translateFn'] = isset($config['translateFn']) && is_callable($config['translateFn']);

                return $config;
            }
        ]
    ]
];
