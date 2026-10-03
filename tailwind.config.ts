import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        arena: {
          green: '#0f9d58',
          dark: '#071d1a',
          gold: '#f7c948',
          slate: '#f4f7f6',
        },
      },
      boxShadow: {
        soft: '0 18px 40px rgba(17, 24, 39, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
