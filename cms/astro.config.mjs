// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

export default defineConfig({
  server: {
    port: 4322,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});