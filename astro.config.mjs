// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node'; // 1. Importamos el nuevo adaptador de Node

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // 2. Le decimos a Astro que construya un servidor dinámico (SSR)
  output: 'server', 

  // 3. Configuramos el adaptador en modo standalone para Hostinger
  adapter: node({
    mode: 'standalone' 
  })
});