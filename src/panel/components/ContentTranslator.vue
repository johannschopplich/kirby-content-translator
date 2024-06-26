<script>
import {
  computed,
  onBeforeUnmount,
  ref,
  usePanel,
  useSection,
  useStore,
} from "kirbyuse";
import { section } from "kirbyuse/props";
import { TRANSLATION_API_ROUTE } from "../constants";
import { useTranslation } from "../composables/translation";

const propsDefinition = {
  ...section,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup>
const props = defineProps(propsDefinition);

const panel = usePanel();
const store = useStore();
const { recursiveTranslateContent } = useTranslation();

// Section props
const label = ref();
const confirm = ref(true);
const syncableFields = ref([]);
const translatableFields = ref([]);
const translatableStructureFields = ref([]);
const translatableObjectFields = ref([]);
const translatableBlocks = ref([]);
const translateTitle = ref(false);

// Section computed
const fields = ref();
const config = ref();

// Generic data
const defaultLanguageData = ref({});

// Static data
const defaultLanguage = panel.languages.find((language) => language.default);

const currentContent = computed(() => store.getters["content/values"]());
const translatableContent = computed(() =>
  Object.fromEntries(
    Object.entries(currentContent.value).filter(([key]) =>
      translatableFields.value.includes(key),
    ),
  ),
);

(async () => {
  const { load } = useSection();
  const response = await load({
    parent: props.parent,
    name: props.name,
  });
  label.value =
    t(response.label) || panel.t("johannschopplich.content-translator.label");
  confirm.value = response.confirm ?? response.config.confirm ?? true;
  syncableFields.value =
    response.syncableFields ?? response.config.syncableFields ?? [];
  translatableFields.value =
    response.translatableFields ?? response.config.translatableFields ?? [];
  translatableStructureFields.value =
    response.translatableStructureFields ??
    response.config.translatableStructureFields ??
    [];
  translatableObjectFields.value =
    response.translatableObjectFields ??
    response.config.translatableObjectFields ??
    [];
  translatableBlocks.value =
    response.translatableBlocks ?? response.config.translatableBlocks ?? [];
  translateTitle.value = response.title ?? response.config.title ?? false;
  fields.value = response.fields ?? {};
  config.value = response.config ?? {};

  // Re-fetch default content whenever the page gets saved
  panel.events.on("model.update", updateModelDefaultLanguageData);
  panel.events.on("page.changeTitle", updateModelDefaultLanguageData);
  updateModelDefaultLanguageData();
})();

onBeforeUnmount(() => {
  panel.events.off("model.update", updateModelDefaultLanguageData);
  panel.events.off("page.changeTitle", updateModelDefaultLanguageData);
});

function t(value) {
  if (!value || typeof value === "string") return value;
  return value[panel.translation.code] ?? Object.values(value)[0];
}

async function syncModelContent(language) {
  let { title, content } = defaultLanguageData.value;

  // If a language is passed, use the content of that language as the source,
  // otherwise use the default language
  if (language) {
    const data = await getModelData(language);
    title = data.title;
    content = data.content;
  }

  const syncableContent = Object.fromEntries(
    Object.entries(content).filter(([key]) =>
      syncableFields.value.includes(key),
    ),
  );

  for (const [key, value] of Object.entries(syncableContent)) {
    store.dispatch("content/update", [key, value]);
  }

  if (translateTitle.value) {
    await panel.api.patch(`${panel.view.path}/title`, { title });
    await panel.view.reload();
  }

  panel.notification.success(
    panel.t("johannschopplich.content-translator.notification.synced"),
  );
}

async function translateModelContent(targetLanguage, sourceLanguage) {
  panel.view.isLoading = true;

  const clone = JSON.parse(JSON.stringify(translatableContent.value));
  try {
    await recursiveTranslateContent(clone, {
      sourceLanguage: sourceLanguage?.code,
      targetLanguage: targetLanguage.code,
      fields: fields.value,
      translatableStructureFields: translatableStructureFields.value,
      translatableObjectFields: translatableObjectFields.value,
      translatableBlocks: translatableBlocks.value,
    });
  } catch (error) {
    console.error(error);
    panel.notification.error(panel.t("error"));
    return;
  }

  // Update content
  for (const [key, value] of Object.entries(clone)) {
    store.dispatch("content/update", [key, value]);
  }

  if (translateTitle.value) {
    const { text } = await panel.api.post(TRANSLATION_API_ROUTE, {
      sourceLanguage: sourceLanguage?.code,
      targetLanguage: targetLanguage.code,
      text: panel.view.title,
    });
    await panel.api.patch(`${panel.view.path}/title`, {
      title: text,
    });
    // Reload will also end loading state
    await panel.view.reload();
  } else {
    panel.view.isLoading = false;
  }

  panel.notification.success(
    panel.t("johannschopplich.content-translator.notification.translated"),
  );
}

async function updateModelDefaultLanguageData() {
  defaultLanguageData.value = await getModelData(defaultLanguage);
}

function getModelData(language) {
  return panel.api.get(panel.view.path, {
    language: language.code,
  });
}

function openModal(text, callback) {
  if (!confirm.value) {
    callback?.();
    return;
  }

  panel.dialog.open({
    component: "k-text-dialog",
    props: { text },
    on: {
      submit: () => {
        panel.dialog.close();
        callback?.();
      },
    },
  });
}
</script>

<template>
  <k-section v-if="config" :label="label">
    <k-box v-if="!panel.multilang" theme="info">
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
          v-for="language in panel.languages.filter(
            (language) => language.code !== panel.language.code,
          )"
          v-show="syncableFields.length"
          :key="language.code"
          size="sm"
          variant="filled"
          @click="
            openModal(
              panel.t('johannschopplich.content-translator.dialog.syncFrom', {
                language: language.name,
              }),
              () => syncModelContent(language),
            )
          "
        >
          {{
            panel.t("johannschopplich.content-translator.importFrom", {
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
              panel.t('johannschopplich.content-translator.dialog.translate', {
                language: panel.language.name,
              }),
              () => translateModelContent(panel.language),
            )
          "
        >
          {{
            panel.t("johannschopplich.content-translator.translate", {
              language: panel.language.code.toUpperCase(),
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
            :disabled="panel.language.default"
            size="sm"
            variant="filled"
            @click="
              openModal(
                panel.t('johannschopplich.content-translator.dialog.sync', {
                  language: defaultLanguage.name,
                }),
                () => syncModelContent(),
              )
            "
          >
            {{ panel.t("johannschopplich.content-translator.sync") }}
          </k-button>
          <k-button
            :disabled="panel.language.default"
            icon="translate"
            size="sm"
            variant="filled"
            theme="notice"
            @click="
              openModal(
                panel.t(
                  'johannschopplich.content-translator.dialog.translate',
                  {
                    language: panel.language.name,
                  },
                ),
                () => translateModelContent(panel.language, defaultLanguage),
              )
            "
          >
            {{
              panel.t("johannschopplich.content-translator.translate", {
                language: panel.language.code.toUpperCase(),
              })
            }}
          </k-button>
        </k-button-group>
      </k-box>

      <k-box
        v-show="panel.language.default"
        class="kct-mt-1"
        theme="none"
        :text="
          panel.t(
            'johannschopplich.content-translator.help.disallowDefaultLanguage',
          )
        "
      />
    </template>
  </k-section>
</template>
