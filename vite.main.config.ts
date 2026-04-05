import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      external: [
        'electron',
        'electron-squirrel-startup',
        'better-sqlite3',
        'ws',
      ],
      output: {
        // Inject NODE_PATH fix at the very top of the bundle, before any require()
        banner: `
const __module = require("node:module");
const __path = require("node:path");
const __app = require("electron").app;
const __appPath = __app.getAppPath();
const __root = __appPath.includes('.vite') ? __path.resolve(__appPath, '..', '..') : __appPath;
process.env.NODE_PATH = __path.join(__root, 'node_modules');
__module._initPaths();
`,
      },
    },
  },
});
