/**
 * Paleta do Ninho.
 *
 * A fonte da verdade é `lib/theme/colors.json` — cópia literal do arquivo
 * `src/theme/tokens/colors.json` do app (Ninho-expo). Se a paleta mudar no
 * app, basta recopiar esse JSON e o site inteiro acompanha.
 *
 * Além dos tokens crus (primary/background/surface/...), expomos aliases
 * `ninho-*` para uso direto nas classes utilitárias das telas do painel.
 */
const tokens = require("./lib/theme/colors.json").light;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens do app, com a mesma forma do tailwind.config.js do Ninho-expo
        primary: tokens.primary,
        background: tokens.background,
        surface: tokens.surface,
        text: tokens.text,
        border: tokens.border,
        category: tokens.category,
        state: tokens.state,
        neutral: tokens.neutral,

        // Aliases semânticos do site/painel
        'ninho-roxo': tokens.primary.DEFAULT,
        'ninho-roxo-escuro': tokens.primary.dark,
        'ninho-roxo-suave': tokens.primary.light,
        'ninho-lavanda': tokens.background.sand,
        'ninho-nuvem': tokens.background.DEFAULT,
        'ninho-grafite': tokens.text.primary,
        'ninho-cinza': tokens.text.secondary,
        'ninho-borda': tokens.border.DEFAULT,
        'ninho-branco': tokens.surface.DEFAULT,
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        pill: '9999px',
      },
      backgroundImage: {
        'gradient-primary': `linear-gradient(135deg, ${tokens.gradient.primaryStart} 0%, ${tokens.gradient.primaryEnd} 100%)`,
        'gradient-ia': `linear-gradient(135deg, ${tokens.gradient.aiStart} 0%, ${tokens.gradient.aiEnd} 100%)`,
      },
    },
  },
  plugins: [],
};
