'use strict';

// Workaround for a Meteor 3 / rspack + reify bundler incompatibility with yargs.
//
// The whole yargs package is pulled into the (test) server bundle as a transitive
// devDependency, and Meteor wraps each of its ESM files in a CommonJS module function
// `function(require, exports, module, __filename, __dirname){…}`. reify rewrites `import`
// statements to `module.link(…)` but does NOT rewrite `import.meta`, and several yargs
// files also redeclare `__dirname` / `require`. Each of those crashes the server bundle
// at boot (notably `meteor test` / Mocha, which then reports 0 tests):
//   - `const __dirname = …`               → "Identifier '__dirname' has already been declared"
//   - `import.meta.url` / `.resolve(…)`    → "Cannot use 'import.meta' outside a module"
//   - `const require = createRequire(…)`   → redeclares the wrapper's `require`
//
// yargs is never called at runtime here (only build tooling references it), so it just
// needs to PARSE as valid CommonJS. Scan every yargs .js/.mjs/.cjs file and rewrite the
// ESM-only constructs to the CommonJS wrapper's __filename / __dirname / require. The
// exact runtime values are irrelevant since the code is never executed. Idempotent and
// best-effort — never fails an install. Runs from package.json "postinstall"; also safe
// to run by hand: `node scripts/patch-yargs-dirname.cjs`.

const fs = require('fs');
const path = require('path');

function collect(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, acc);
    else if (/\.(js|mjs|cjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function patchFile(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return false; }
  if (!src.includes('import.meta') && !/const\s+require\s*=\s*createRequire\(/.test(src) && !/const\s+__dirname\b/.test(src)) {
    return false;
  }
  let out = src;

  // import.meta.* → CommonJS-wrapper equivalents.
  out = out.replace(/fileURLToPath\(\s*import\.meta\.url\s*\)/g, '__filename');
  out = out.replace(/import\.meta\.resolve\s*\(/g, 'require.resolve(');
  out = out.replace(/import\.meta\.dirname/g, '__dirname');
  out = out.replace(/import\.meta\.filename/g, '__filename');
  out = out.replace(/import\.meta\.url/g, "(require('url').pathToFileURL(__filename).href)");

  // Drop `const require = createRequire(…)` (collides with the wrapper's require).
  out = out.replace(/const\s+require\s*=\s*createRequire\([^)]*\)\s*;?/g, '/* Meteor: use wrapper require */');

  // If a file declares its own top-level `const __dirname`, rename every __dirname in it
  // (declaration + uses) so it cannot collide with the wrapper's __dirname parameter.
  if (/const\s+__dirname\b/.test(out)) {
    out = out.replace(/\b__dirname\b/g, '__dirnameYargs');
  }

  if (out !== src) { fs.writeFileSync(file, out); return true; }
  return false;
}

const YARGS = path.join('node_modules', 'yargs');
try {
  if (!fs.existsSync(YARGS)) process.exit(0);
  let n = 0;
  for (const f of collect(YARGS, [])) { if (patchFile(f)) n += 1; }
  if (n) console.log('patch-yargs-dirname: made', n, 'yargs file(s) Meteor CommonJS-wrapper safe');
  const leftovers = collect(YARGS, []).filter(f => {
    try { return /import\.meta/.test(fs.readFileSync(f, 'utf8')); } catch (e) { return false; }
  });
  if (leftovers.length) console.warn('patch-yargs-dirname: WARNING import.meta still in', leftovers.join(', '));
} catch (e) {
  console.warn('patch-yargs-dirname: skipped -', (e && e.message) || e);
}
