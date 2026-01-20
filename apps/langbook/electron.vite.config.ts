import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { alias } from './vite.alias';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    resolve: { alias },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    resolve: { alias },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: { alias },
    plugins: [vue()],
  },
});
