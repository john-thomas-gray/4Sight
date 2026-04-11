/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,png,jpg,jpeg}",
    "./components/**/*.{js,jsx,ts,tsx,png,jpg,jpeg}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "team-one": "var(--team-one-color)",
        "team-two": "var(--team-two-color)",
        "well-grid-bg": "var(--well-grid-background-color)",
        "well-bg": "var(--well-background-color)",
        "slot-border": "var(--slot-border-color)",
        "slot-bg": "var(--slot-background-color)",
        "slot-insert": "var(--slot-insert-color)",
        "odd-space": "var(--odd-space-color)",
        "even-space": "var(--even-space-color)",
        "felt-top": "var(--felt-top)",
      },
    },
  },
  plugins: [],
};
