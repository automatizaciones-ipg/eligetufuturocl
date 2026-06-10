// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [react()],

  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client'
      ]
    },
    resolve: {
      dedupe: ['react', 'react-dom']
    }
  },

  output: 'server',

  adapter: node({
    mode: 'standalone',
    // @ts-ignore
    host: process.env.HOST || '0.0.0.0',
    // @ts-ignore
    port: parseInt(process.env.PORT) || 4321
  })
});