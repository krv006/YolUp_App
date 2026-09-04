const palette = require("./src/shared/ui/palette.json");

/**
 * Rang QIYMATLARI bu yerda yozilmaydi — ular `palette.json` da va CSS
 * o'zgaruvchisi sifatida `global.css` ga generatsiya qilinadi. Bu yerda faqat
 * Tailwind nomini o'zgaruvchiga bog'lash, shunda `dark:` varianti avtomatik
 * ishlaydi (NativeWind `.dark` klassini o'zi qo'yadi).
 */
const colors = Object.fromEntries(
  Object.keys(palette.light).map((name) => [name, `var(--${name})`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors,
      borderRadius: { xs: "7px", sm: "10px", md: "13px", lg: "16px", xl: "20px" },
      fontSize: {
        "2xs": "11px", xs: "12px", sm: "13px", md: "14px", lg: "15px", xl: "16px",
        "2xl": "17px", "3xl": "19px", "4xl": "21px", "5xl": "24px", "6xl": "28px", "7xl": "44px",
      },
    },
  },
  plugins: [],
};
