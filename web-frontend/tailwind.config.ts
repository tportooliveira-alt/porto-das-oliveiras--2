import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        oliva:           'var(--oliva)',
        'oliva-escuro':  'var(--oliva-escuro)',
        terracota:       'var(--terracota)',
        'terracota-escuro': 'var(--terracota-escuro)',
        areia:           'var(--areia)',
        'areia-clara':   'var(--areia-clara)',
        branco:          'var(--branco)',
        sepia:           'var(--sepia)',
        'sepia-soft':    'var(--sepia-soft)',
        linha:           'var(--linha)',

        disponivel: 'rgb(var(--color-disponivel) / <alpha-value>)',
        reservado:  'rgb(var(--color-reservado) / <alpha-value>)',
        vendido:    'rgb(var(--color-vendido) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Display Fraunces (clamp para fluido)
        'display-xl': ['clamp(64px, 9vw, 116px)', { lineHeight: '0.94', letterSpacing: '-0.025em', fontWeight: '500' }],
        'display-lg': ['clamp(56px, 7vw, 88px)',  { lineHeight: '0.96', letterSpacing: '-0.022em', fontWeight: '500' }],
        'display-md': ['clamp(40px, 5vw, 64px)',  { lineHeight: '1.00', letterSpacing: '-0.020em', fontWeight: '500' }],
        'display-sm': ['clamp(28px, 3.5vw, 40px)', { lineHeight: '1.10', letterSpacing: '-0.015em', fontWeight: '500' }],
      },
      borderRadius: {
        'card': '24px',
        'pip':  '16px',
      },
      boxShadow: {
        'card':  'var(--shadow-card)',
        'hover': 'var(--shadow-hover)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
