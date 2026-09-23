import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  // Components use hooks — mark the bundle as a client module for the Next.js App Router
  banner: { js: '"use client";' },
  // Match package.json: dist/index.js (cjs) + dist/index.esm.js (esm)
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.esm.js' : '.js' }),
})
