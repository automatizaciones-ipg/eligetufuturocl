import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  // URL canónica del sitio: necesaria para canonical, Open Graph y sitemap.
  site: process.env['PUBLIC_SITE_URL'] || 'https://eligetufuturo.cl',

  integrations: [react()],

  vite: {
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
    host: process.env['HOST'] || '0.0.0.0',
    port: parseInt(process.env['PORT']) || 4321
  })
});