import ContentTranslator from "./components/ContentTranslator.vue";
import "./index.css";

window.panel.plugin("johannschopplich/website", {
  sections: {
    "content-translator": ContentTranslator,
  },
});
