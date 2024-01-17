<script>
import SectionMixin from "../mixins/section.js";
import LocaleMixin from "../mixins/locale.js";
import TranslationMixin from "../mixins/translation.js";

export default {
  mixins: [SectionMixin, LocaleMixin, TranslationMixin],
  inheritAttrs: false,

  data() {
    return {
      // Section props
      label: undefined,
      confirm: true,
      syncableFields: [],
      translatableFields: [],
      translatableBlocks: [],
      // Section computed
      config: undefined,
      // Generic data
      defaultLanguage: this.$panel.languages.find(
        (language) => language.default,
      ),
      defaultContent: {},
    };
  },

  computed: {
    currentContent() {
      return this.$store.getters["content/values"]();
    },
    syncableContent() {
      return Object.fromEntries(
        Object.entries(this.defaultContent).filter(([key]) =>
          this.syncableFields.includes(key),
        ),
      );
    },
    translatableContent() {
      return Object.fromEntries(
        Object.entries(this.currentContent).filter(([key]) =>
          this.translatableFields.includes(key),
        ),
      );
    },
  },

  async created() {
    const response = await this.load();
    this.label =
      this.t(response.label) ||
      this.$t("johannschopplich.content-translator.label");
    this.confirm = response.confirm ?? response.config.confirm ?? true;
    this.translatableFields =
      response.translatableFields ?? response.config.translatableFields ?? [];
    this.syncableFields =
      response.syncableFields ?? response.config.syncableFields ?? [];
    this.translatableBlocks =
      response.translatableBlocks ?? response.config.translatableBlocks ?? [];
    this.config = response.config ?? {};

    // Re-fetch default content whenever the page gets saved
    this.$panel.events.on("model.update", this.updateModelDefaultContent);
    this.updateModelDefaultContent();
  },

  beforeDestroy() {
    this.$panel.events.off("model.update", this.updateModelDefaultContent);
  },

  methods: {
    t(value) {
      if (!value || typeof value === "string") return value;
      return value[this.$panel.translation.code] ?? Object.values(value)[0];
    },
    async syncModelContent(language) {
      // If a language is passed, use the content of that language as the source,
      // otherwise use the default language
      const _syncableContent = language
        ? await this.getSyncableContentForLanguage(language)
        : this.syncableContent;

      for (const [key, value] of Object.entries(_syncableContent)) {
        this.$store.dispatch("content/update", [key, value]);
      }

      this.$panel.notification.success(
        this.$t("johannschopplich.content-translator.notification.synced"),
      );
    },
    async translateModelContent(targetLanguage, sourceLanguage) {
      this.$panel.view.isLoading = true;

      const clone = JSON.parse(JSON.stringify(this.translatableContent));
      try {
        await this.recursiveTranslateContent(clone, {
          sourceLanguage: sourceLanguage?.code,
          targetLanguage: targetLanguage.code,
          translatableBlocks: this.translatableBlocks,
        });
      } catch (error) {
        console.error(error);
        this.$panel.notification.error(this.$t("error"));
        return;
      }

      // Update content
      for (const [key, value] of Object.entries(clone)) {
        this.$store.dispatch("content/update", [key, value]);
      }

      this.$panel.view.isLoading = false;
      this.$panel.notification.success(
        this.$t("johannschopplich.content-translator.notification.translated"),
      );
    },
    async updateModelDefaultContent() {
      const { content } = await this.$api.get(this.$panel.view.path, {
        language: this.defaultLanguage.code,
      });

      this.defaultContent = content;
    },
    async getSyncableContentForLanguage(language) {
      const { content } = await this.$api.get(this.$panel.view.path, {
        language: language.code,
      });

      return Object.fromEntries(
        Object.entries(content).filter(([key]) =>
          this.syncableFields.includes(key),
        ),
      );
    },
    openModal(text, callback) {
      if (!this.confirm) {
        callback?.();
        return;
      }

      this.$panel.dialog.open({
        component: "k-text-dialog",
        props: { text },
        on: {
          submit: () => {
            this.$panel.dialog.close();
            callback?.();
          },
        },
      });
    },
  },
};
</script>

<template>
  <k-section v-if="config" :label="label">
    <k-box v-if="!$panel.multilang" theme="info">
      <k-text>
        This section requires multi-language support to be enabled.
      </k-text>
    </k-box>
    <k-box
      v-else-if="!config.translateFn && !config.DeepL?.apiKey"
      theme="empty"
    >
      <k-text>
        You need to set the either a custom <code>translateFn</code> or the
        <code>DeepL.apiKey</code> option for the
        <code>johannschopplich.content-translator</code> namespace in your Kirby
        configuration.
      </k-text>
    </k-box>
    <k-box v-else-if="!translatableFields.length" theme="info">
      <k-text>
        You have to define at least one translatable field for the
        <code>translatableFields</code> blueprint or in your Kirby
        configuration.
      </k-text>
    </k-box>
    <k-box v-else-if="config.allowDefaultLanguageOverwrite" theme="none">
      <k-button-group layout="collapsed">
        <k-button
          v-for="language in $panel.languages.filter(
            (language) => language.code !== $panel.language.code,
          )"
          v-show="syncableFields.length"
          :key="language.code"
          size="sm"
          variant="filled"
          @click="
            openModal(
              $t('johannschopplich.content-translator.dialog.syncFrom', {
                language: language.name,
              }),
              () => syncModelContent(language),
            )
          "
        >
          {{
            $t("johannschopplich.content-translator.importFrom", {
              language: language.code.toUpperCase(),
            })
          }}
        </k-button>
        <k-button
          icon="translate"
          size="sm"
          variant="filled"
          theme="notice"
          @click="
            openModal(
              $t('johannschopplich.content-translator.dialog.translate', {
                language: $panel.language.name,
              }),
              () => translateModelContent($panel.language),
            )
          "
        >
          {{
            $t("johannschopplich.content-translator.translate", {
              language: $panel.language.code.toUpperCase(),
            })
          }}
        </k-button>
      </k-button-group>
    </k-box>
    <template v-else>
      <k-box theme="none">
        <k-button-group layout="collapsed">
          <k-button
            v-show="syncableFields.length"
            :disabled="$panel.language.default"
            size="sm"
            variant="filled"
            @click="
              openModal(
                $t('johannschopplich.content-translator.dialog.sync', {
                  language: defaultLanguage.name,
                }),
                () => syncModelContent(),
              )
            "
          >
            {{ $t("johannschopplich.content-translator.sync") }}
          </k-button>
          <k-button
            :disabled="$panel.language.default"
            icon="translate"
            size="sm"
            variant="filled"
            theme="notice"
            @click="
              openModal(
                $t('johannschopplich.content-translator.dialog.translate', {
                  language: $panel.language.name,
                }),
                () => translateModelContent($panel.language, defaultLanguage),
              )
            "
          >
            {{
              $t("johannschopplich.content-translator.translate", {
                language: $panel.language.code.toUpperCase(),
              })
            }}
          </k-button>
        </k-button-group>
      </k-box>

      <k-box
        v-show="$panel.language.default"
        class="kct-mt-1"
        theme="none"
        :text="
          $t('johannschopplich.content-translator.help.disallowDefaultLanguage')
        "
      />
    </template>
  </k-section>
</template>
