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
      // Externalize Prisma in dev mode to avoid CommonJS/ESM issues
      // Bundle it in production for Netlify Functions
      noExternal: process.env.NODE_ENV === 'production' 
        ? ['@prisma/client', '@prisma/adapter-pg', 'pg', 'socket.io-client']
        : ['socket.io-client'],
    },
    optimizeDeps: {
      exclude: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
    },
    resolve: {
      alias: {},
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: process.env.NODE_ENV === 'production' 
        ? { external: [] }
        : { external: ['@prisma/client', '@prisma/adapter-pg', 'pg'] },
    },
  },
});

