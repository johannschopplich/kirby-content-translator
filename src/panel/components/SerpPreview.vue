<script>
import { joinURL, withLeadingSlash } from "ufo";
import SectionMixin from "../mixins/section.js";
import LocaleMixin from "../mixins/locale.js";

export default {
  mixins: [SectionMixin, LocaleMixin],

  data() {
    return {
      label: undefined,
      config: {},
      url: "",
    };
  },

  computed: {
    currentContent() {
      return this.$store.getters["content/values"]();
    },
    path() {
      if (!this.url) return "";

      if (!this.$panel.multilang) {
        const url = new URL(this.url);
        return url.pathname;
      }

      let path = this.getNonLocalizedPath(this.url);

      if (!this.config.defaultLanguagePrefix) {
        if (!this.$panel.language.default) {
          path = joinURL(this.$panel.language.code, path);
        }
      } else {
        path = joinURL(this.$panel.language.code, path);
      }

      return withLeadingSlash(path);
    },
  },

  watch: {
    "$panel.language.code": {
      async handler() {
        const { url } = await this.$api.get(this.$panel.view.path);
        this.url = url;
      },
      immediate: true,
    },
  },

  async created() {
    const response = await this.load();
    this.label = this.t(response.label) || "SERP Preview";
    this.config = response.config;
  },

  methods: {
    joinURL,

    t(value) {
      if (Array.isArray(value)) {
        return value[this.$panel.translation.code] ?? Object.values(value)[0];
      }

      return value;
    },
  },
};
</script>

<template>
  <k-section :label="label">
    <div
      class="kcts-overflow-hidden kcts-rounded-[var(--input-rounded)] kcts-bg-[var(--input-color-back)] kcts-p-4"
    >
      <div class="kcts-mb-2 kcts-flex kcts-items-center kcts-gap-3">
        <figure
          class="kcts-inline-flex kcts-aspect-square kcts-h-[26px] kcts-w-[26px] kcts-items-center kcts-justify-center kcts-rounded-full kcts-border kcts-border-solid kcts-border-[#ecedef] kcts-bg-[#f1f3f4]"
        >
          <img
            class="kcts-block kcts-h-[18px] kcts-w-[18px]"
            :src="config.faviconUrl || '/assets/favicon.svg'"
            alt=""
          />
        </figure>
        <div class="kcts-flex kcts-flex-col">
          <span class="kcts-text-sm kcts-text-[#4d5156]">{{
            config.siteTitle
          }}</span>
          <span class="kcts-line-clamp-1 kcts-text-xs kcts-text-[#4d5156]">{{
            joinURL(config.siteUrl, path)
          }}</span>
        </div>
      </div>

      <h3 class="kcts-mb-1 kcts-line-clamp-1 kcts-text-xl kcts-text-[#1a0dab]">
        {{
          currentContent[config.titleContentKey] ||
          `${$panel.view.title} ${(config.titleSeparator || "–").trim()} ${
            config.siteTitle
          }`
        }}
      </h3>

      <p class="kcts-line-clamp-2 kcts-text-sm kcts-text-[#4d5156]">
        {{ currentContent[config.descriptionContentKey] }}
      </p>
    </div>

    <k-button-group
      v-show="config.searchConsoleUrl"
      class="kcts-mt-2 kcts-w-full"
    >
      <k-button
        :link="config.searchConsoleUrl"
        icon="open"
        target="_blank"
        rel="noopener noreferrer"
      >
        Google Search Console
      </k-button>
    </k-button-group>
  </k-section>
</template>
