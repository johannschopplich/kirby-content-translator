import ContentTranslator from "./components/ContentTranslator.vue";
import "./index.css";

window.panel.plugin("johannschopplich/content-translator", {
  sections: {
    "content-translator": ContentTranslator,
  },
});
