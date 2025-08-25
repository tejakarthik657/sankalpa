import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'glsl-loader',
      transform(code, id) {
        if (id.endsWith('.glsl')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
      },
    },
  ],
});