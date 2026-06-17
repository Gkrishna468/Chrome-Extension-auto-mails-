import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist-extension',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          content: path.resolve(__dirname, 'src/content.tsx'),
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        }
      }
    }
  };
});
