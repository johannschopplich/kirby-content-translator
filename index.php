<?php

@include_once __DIR__ . '/vendor/autoload.php';

use Kirby\Cms\App;

App::plugin('johannschopplich/content-translator', [
    'api' => require __DIR__ . '/src/extensions/api.php',
    'sections' => require __DIR__ . '/src/extensions/sections.php',
    'translations' => require __DIR__ . '/src/extensions/translations.php'
]);
