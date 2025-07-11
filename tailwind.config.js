/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,png,jpg,jpeg}",
    "./components/**/*.{js,jsx,ts,tsx,png,jpg,jpeg}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
