import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas:     'rgb(var(--color-canvas) / <alpha-value>)',
        ink:        'rgb(var(--color-ink) / <alpha-value>)',
        border:     'rgb(var(--color-border) / <alpha-value>)',
        disponivel: 'rgb(var(--color-disponivel) / <alpha-value>)',
        reservado:  'rgb(var(--color-reservado) / <alpha-value>)',
        vendido:    'rgb(var(--color-vendido) / <alpha-value>)',
        action:     'rgb(var(--color-action) / <alpha-value>)',
      },
      borderWidth: { DEFAULT: '2px', thick: '3px' },
      fontSize: {
        'field-sm': ['1rem',     { lineHeight: '1.4', fontWeight: '600' }],
        'field':    ['1.125rem', { lineHeight: '1.4', fontWeight: '700' }],
        'field-lg': ['1.5rem',   { lineHeight: '1.3', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
};

export default config;
