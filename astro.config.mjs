import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [react(), tailwind()],
  vite: {
    ssr: {
      noExternal: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
    },
    optimizeDeps: {
      exclude: ['@prisma/client'],
    },
  },
});

