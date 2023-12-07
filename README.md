![Kirby Content Translator](./.github/kirby-content-translator.png)

# Kirby Content Translator

Sometimes you may find yourself copying content from Kirby fields to your clipboard, only to paste it into a translation service of your choice. This plugin aims to simplify the translation process by providing a simple interface for translating a model's content while giving full flexibility on which fields should be translated.

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

First, set up the Panel section in one of your blueprints, e.g. a page blueprint and configure the fields that should be synchronised and translated:

- The `syncableFields` key defines the fields that should be copied from the default language to the secondary language when the user is editing content in any language but the default language.
- The `translatableFields` key defines the fields that should be translated when the user clicks the translate button.

Below you will find an example configuration to display the section in the Panel:

```yml
sections:
  contentTranslator:
    type: content-translator
    # Define field names which should be synced from the default language to other languages
    syncableFields:
      - text
      - description
      - tags
    # Define field names that should be translated
    translatableFields:
      - text
      - description
    # Define the field names inside blocks which should be translated
    translatableBlocks:
      # Example: translate the `text` field of the `heading` block
      heading:
        - text
      text:
        - text
      image:
        - alt
        - caption
```

Finally, store the DeepL API key in your config file:

```php
# /site/config/config.php
return [
    'johannschopplich.content-translator' => [
        // API key for the DeepL API
        'DeepL' => [
            'apiKey' => 'abc123…'
        ]
    ]
];
```

### Section Label

Optionally, you can translate the section label by adding a `label` key:

```yml
sections:
  contentTranslator:
    type: content-translator
    # Either use a single label for all languages
    label: Translator
    # Or use language codes for multilingual labels
    # label:
    #   en: Translator
    #   de: Übersetzer
```

### Custom Translator Function

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

### Skip Dialogs Before Synchronising/Translating

To make sure an editor doesn't accidentally synchronise or translate content and thus overwrite existing translations, a confirmation dialog is displayed before the process is started. If you want to skip this dialog, you can set the `confirm` key to `false`:

```yml
sections:
  contentTranslator:
    type: content-translator
    confirm: false
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)

[MIT](./LICENSE) License © 2023-PRESENT [Dennis Baum](https://github.com/dennisbaum)
