import { defineConfig } from 'vitest/config';
import { alias } from './vite.alias';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'common',
          environment: 'node',
          include: ['tests/unit/common/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'main',
          environment: 'node',
          include: ['tests/unit/main/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'renderer',
          environment: 'happy-dom',
          include: ['tests/unit/renderer/**/*.test.ts'],
        },
      },
    ],
  },
});
