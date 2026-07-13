'use strict';

// Workaround for a Meteor 3 / rspack + reify bundler incompatibility with yargs.
//
// The whole yargs package gets pulled into the (test) server bundle as a transitive
// devDependency, and its ESM shim node_modules/yargs/lib/platform-shims/esm.mjs is wrapped
// by Meteor in a CommonJS module function `function(require, exports, module, __filename,
// __dirname){…}`. reify rewrites the file's `import` statements to `module.link(…)` but
// does NOT rewrite `import.meta`, and the file also redeclares `__dirname` and `require`.
// So the wrapped file has three problems that each crash the server bundle at boot
// (notably `meteor test` / Mocha, which then reports 0 tests):
//   1. `const __dirname = …`   → "Identifier '__dirname' has already been declared"
//   2. `import.meta.url`        → "Cannot use 'import.meta' outside a module"
//   3. `const require = …`      → redeclares the wrapper's `require`
//
// yargs is never used at runtime here (only build tooling references it), so rewrite the
// shim to use the CommonJS wrapper's __filename / __dirname / require instead of the ESM
// constructs. Idempotent and best-effort: it never fails an install. Runs from the
// package.json "postinstall"; also safe to run by hand: `node scripts/patch-yargs-dirname.cjs`.

const fs = require('fs');
const path = require('path');

const FILE = path.join('node_modules', 'yargs', 'lib', 'platform-shims', 'esm.mjs');

try {
  if (!fs.existsSync(FILE)) process.exit(0);
  const src = fs.readFileSync(FILE, 'utf8');
  let out = src;

  // (2) import.meta.url → the wrapper's __filename (a real path; keeps yargs' mainFilename
  //     computation working). Covers both `fileURLToPath(import.meta.url)` and bare uses.
  out = out.replace(/fileURLToPath\(\s*import\.meta\.url\s*\)/g, '__filename');
  out = out.replace(/import\.meta\.url/g, '__filename');

  // (3) Drop `const require = createRequire(...)`: it redeclares the wrapper's require.
  out = out.replace(/const\s+require\s*=\s*createRequire\([^)]*\)\s*;?/g,
    '/* Meteor: use the CommonJS module wrapper require */');

  // (1) Rename yargs' own top-level `const __dirname` (and its uses) so it cannot collide
  //     with the wrapper's __dirname parameter. Other `__dirname` references fall through
  //     to the wrapper's, which is correct.
  out = out.replace(/const\s+__dirname\b/g, 'const __dirnameYargs');
  out = out.replace(/__dirname\.substring/g, '__dirnameYargs.substring');
  out = out.replace(/__dirname\.lastIndexOf/g, '__dirnameYargs.lastIndexOf');

  if (out !== src) {
    fs.writeFileSync(FILE, out);
    console.log('patch-yargs-dirname: rewrote yargs esm.mjs to be Meteor CommonJS-wrapper safe');
  }
  if (/import\.meta/.test(out)) {
    console.warn('patch-yargs-dirname: WARNING import.meta still present in', FILE);
  }
} catch (e) {
  // Never break `npm install` over this best-effort workaround.
  console.warn('patch-yargs-dirname: skipped -', (e && e.message) || e);
}
