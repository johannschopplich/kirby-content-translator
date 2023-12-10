/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["src/panel/**/*.vue"],
  // Circumvent colliding class names for multiple plugins using Tailwind CSS
  prefix: "kcts-",
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
