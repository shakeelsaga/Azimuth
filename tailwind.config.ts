import type { Config } from 'tailwindcss';

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#ffffff',
        'faint-ash': '#eeeeee',
        steel: '#888a8b',
        charcoal: '#222222',
        showcase: '#f4c95d',
      },
      boxShadow: {},
    },
  },
} satisfies Config;

export default config;
