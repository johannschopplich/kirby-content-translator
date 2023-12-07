![Kirby Content Translator](./.github/kirby-content-translator.png)

# Kirby Content Translator

Sometimes you find yourself copying content to your clipboard, only to paste it into the translation service of your choice. This plugin aims to simplify this process by providing a simple interface for translating your content.

You define a set of fields to be translated and the plugin will automatically translate the content for you. You can also define a set of fields that should be synchronised from the default language to the other languages.

## Key Features

- 🌐 Translate page and block fields with one click!
- 🌝 Panel buttons
- 🧩 Use DeepL API or custom translation service

## Preview

For the following preview, I used the [default configuration](#configuration) to synchronise the `description` and `text` fields, which are a **writer** and **blocks** field, respectively.

The default language in the example is English. The secondary language is German, to which the content is first synchronised and then translated.

![Preview of the Kirby Content Translator Panel section](./.github/panel-preview.gif)

## Requirements

- Kirby 4+

Kirby is not a free software. You can try it for free on your local machine but in order to run Kirby on a public server you must purchase a [valid license](https://getkirby.com/buy).

## Installation

### Composer

```bash
composer require johannschopplich/kirby-content-translator
```

### Download

Download and copy this repository to `/site/plugins/kirby-content-translator`.

## Setup

### Deepl Account

By default, this plugin uses the [DeepL API](https://www.deepl.com) to translate your content. You can use any other translation service by defining a custom translator function (see below).

In order to use the DeepL API, you have to [create an account](https://www.deepl.com/de/pro-api) and [generate an API key](https://www.deepl.com/de/account/summary).

## Usage

### Configuration

```php
# /site/config/config.php
return [
    'johannschopplich.content-translator' => [
        // Define field names which should be synced from the default language
        // to the other languages
        'syncableFields' => ['text', 'description', 'tags'],
        // Define field names that should be translated
        'translatableFields' => ['text', 'description'],
        // Define the field names inside blocks which should be translated
        'translatableBlocks' => [
            // Example: translate the `text` field of the `heading` block
            'heading' => ['text'],
            'text' => ['text'],
            'image' => ['alt', 'caption']
        ],
        // API key for the DeepL API
        'DeepL' => [
            'apiKey' => 'abc123…'
        ]
    ]
];
```

#### Panel Section

To display the translation Panel section, you have to add the following snippet to your panel blueprint.

```yml
sections:
  contentTranslator:
    type: content-translation
```

Optionally, you can translate the section label by adding a `label` key:

```yml
sections:
  contentTranslator:
    type: content-translation
    # Either use a single label for all languages
    label: Translator
    # Or use language codes for multilingual labels
    # label:
    #   en: Translator
    #   de: Übersetzer
```

#### Custom Translator Function

Instead of using the DeepL API, you can define a custom translator callback that accepts the text to be translated, the source language code and the target language code.

```php
# /site/config/config.php
return [
    'johannschopplich.algolia-docsearch' => [
        'translateFn' => function (string $text, string|null $sourceLanguageCode, string $targetLanguageCode) {
          return myCustomTranslateFunction($text, $sourceLanguageCode, $targetLanguageCode);
        }
    ]
];
```

## Special Thanks

- [Dennis Baum](https://github.com/dennisbaum) for sponsoring the initial version of this package. 🙏

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
