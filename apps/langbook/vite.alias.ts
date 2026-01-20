import path from 'path';

export const alias = {
  '@interapp': path.resolve(__dirname, '../../interapp/src'),
  '@renderer': path.resolve(__dirname, 'src/renderer'),
  '@common': path.resolve(__dirname, 'src/common'),
  '@main': path.resolve(__dirname, 'src/main'),
  '@preload': path.resolve(__dirname, 'src/preload'),
};
