import SerpPreview from "./components/SerpPreview.vue";
import ContentTranslator from "./components/ContentTranslator.vue";
import "./index.css";

window.panel.plugin("johannschopplich/website", {
  sections: {
    "serp-preview": SerpPreview,
    "content-translator": ContentTranslator,
  },
});
