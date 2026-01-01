import path from 'path';

export const alias = {
  '@renderer': path.resolve(__dirname, 'src/renderer'),
  '@common': path.resolve(__dirname, 'src/common'),
  '@main': path.resolve(__dirname, 'src/main'),
  '@preload': path.resolve(__dirname, 'src/preload'),
};
