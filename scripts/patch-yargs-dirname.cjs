'use strict';

// Workaround for a Meteor 3 / rspack bundler incompatibility with yargs.
//
// yargs' ESM shim node_modules/yargs/lib/platform-shims/esm.mjs starts with
//   const __dirname = fileURLToPath(import.meta.url);
// When Meteor bundles this .mjs it wraps it in a CommonJS module function whose
// signature already declares __dirname, so the file's own `const __dirname` collides:
//   SyntaxError: Identifier '__dirname' has already been declared
// which crashes the whole server bundle at boot (notably `meteor test` / Mocha).
//
// yargs is only ever reachable from build configs here (nothing in WeKan uses it at
// runtime); it merely got installed as a transitive devDependency. Rather than fight the
// bundler, rename yargs' local __dirname so it can no longer collide. Idempotent and
// best-effort: it never fails an install.
//
// Runs from package.json "postinstall". Safe to run repeatedly.

const fs = require('fs');
const path = require('path');

const FILE = path.join('node_modules', 'yargs', 'lib', 'platform-shims', 'esm.mjs');

try {
  if (!fs.existsSync(FILE)) process.exit(0);
  let src = fs.readFileSync(FILE, 'utf8');
  if (!/const __dirname\b/.test(src)) process.exit(0); // already patched / different version
  const patched = src
    .replace(/const __dirname\b/g, 'const __dirnameYargs')
    .replace(/__dirname\.substring/g, '__dirnameYargs.substring')
    .replace(/__dirname\.lastIndexOf/g, '__dirnameYargs.lastIndexOf');
  if (patched !== src) {
    fs.writeFileSync(FILE, patched);
    console.log('patch-yargs-dirname: renamed yargs esm.mjs __dirname to avoid Meteor bundler collision');
  }
} catch (e) {
  // Never break `npm install` over this best-effort workaround.
  console.warn('patch-yargs-dirname: skipped -', (e && e.message) || e);
}
