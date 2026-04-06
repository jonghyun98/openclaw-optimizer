import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  ssr: {
    // Mark native modules as external (not bundled)
    external: ['better-sqlite3', 'ws', 'electron-squirrel-startup'],
    noExternal: true, // Bundle everything else
    target: 'node',
  },
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    ssr: 'src/main/index.ts',
    rollupOptions: {
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
        banner: `
const __module = require("node:module");
const __pathLib = require("node:path");
process.env.NODE_PATH = __pathLib.resolve(__dirname, "..", "..", "node_modules");
__module._initPaths();
`,
      },
    },
    minify: false,
    sourcemap: true,
  },
});
