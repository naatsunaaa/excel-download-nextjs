import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { 'client/index': 'src/client/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    external: ['next', 'react'],
    clean: true,
  },
  {
    entry: { 'route/index': 'src/route/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    external: ['next', 'axios'],
    clean: false,
  },
])
