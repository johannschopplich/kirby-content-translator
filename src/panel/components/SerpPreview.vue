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
    content() {
      return this.$store.getters["content/values"]();
    },
    path() {
      if (!this.url) return "";

      if (!this.$panel.multilang) {
        const url = new URL(this.url);
        return url.pathname;
      }

      let path = this.getNonLocalizedPath(this.url);

      if (config.defaultLanguagePrefix) {
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
      class="overflow-hidden rounded-[var(--input-rounded)] bg-[var(--input-color-back)] p-4"
    >
      <div class="flex items-center gap-3 mb-2">
        <figure
          class="inline-flex aspect-square h-[26px] w-[26px] items-center justify-center rounded-full border border-solid border-[#ecedef] bg-[#f1f3f4]"
        >
          <img
            class="block h-[18px] w-[18px]"
            :src="config.faviconUrl || '/assets/favicon.svg'"
            alt=""
          />
        </figure>
        <div class="flex flex-col">
          <span class="text-sm text-[#4d5156]">{{ config.title }}</span>
          <span class="line-clamp-1 text-xs text-[#4d5156]">{{
            joinURL(config.baseUrl || config.url, path)
          }}</span>
        </div>
      </div>

      <h3 class="mb-1 line-clamp-1 text-xl text-[#1a0dab]">
        {{ content.customTitle || `${$panel.view.title} – ${config.title}` }}
      </h3>

      <p class="line-clamp-2 text-sm text-[#4d5156]">
        {{ content.description }}
      </p>
    </div>
  </k-section>
</template>
