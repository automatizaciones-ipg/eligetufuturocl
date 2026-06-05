// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    // @ts-ignore: Ignoramos el conflicto de tipos entre Vite 6 y Vite 7
    plugins: [tailwindcss()]
  },

  // Le decimos a Astro que construya un servidor dinámico (SSR)
  output: 'server', 

  // Configuramos el adaptador en modo standalone para Hostinger
  adapter: node({
    mode: 'standalone' 
  })
});