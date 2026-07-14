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

// Marker left behind where a `const require = createRequire(…)` was removed.
const REQUIRE_MARKER = '/* Meteor: use wrapper require */';

function patchFile(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return false; }
  // Also reprocess files a previous (buggy) run left in the broken state below.
  const hasBroken = src.includes(REQUIRE_MARKER + '.pathToFileURL');
  if (!src.includes('import.meta') && !/const\s+require\s*=\s*[^;\n]*createRequire/.test(src) && !/const\s+__dirname\b/.test(src) && !hasBroken) {
    return false;
  }
  let out = src;

  // Repair a previously-botched patch: an earlier version expanded `import.meta.url`
  // INSIDE `createRequire(...)` before removing the createRequire call, so the
  // paren-naive removal regex stopped at the first `)` of the injected
  // `require('url')` and left a dangling `.pathToFileURL(__filename).href))` after
  // the marker — an "Unexpected token" that crashed the test server bundle. Collapse
  // that leftover back to just the marker.
  out = out.replace(
    /\/\* Meteor: use wrapper require \*\/\s*\.pathToFileURL\([^)]*\)\.href\)\)/g,
    REQUIRE_MARKER,
  );

  // Drop any top-level `const require = …createRequire…;` (collides with the
  // wrapper's require). Covers both the direct form `const require =
  // createRequire(import.meta.url)` and the guarded ternary bundlers emit,
  // `const require = createRequire ? createRequire(import.meta.url) : undefined;`.
  // Matched line-wise (`[^;\n]*`) and run BEFORE expanding import.meta.url below,
  // so the injected `require('url')…` parens can never confuse this match.
  out = out.replace(/const\s+require\s*=\s*[^;\n]*createRequire[^;\n]*;?/g, REQUIRE_MARKER);

  // import.meta.* → CommonJS-wrapper equivalents.
  out = out.replace(/fileURLToPath\(\s*import\.meta\.url\s*\)/g, '__filename');
  out = out.replace(/import\.meta\.resolve\s*\(/g, 'require.resolve(');
  out = out.replace(/import\.meta\.dirname/g, '__dirname');
  out = out.replace(/import\.meta\.filename/g, '__filename');
  out = out.replace(/import\.meta\.url/g, "(require('url').pathToFileURL(__filename).href)");

  // If a file declares its own top-level `const __dirname`, rename every __dirname in it
  // (declaration + uses) so it cannot collide with the wrapper's __dirname parameter.
  if (/const\s+__dirname\b/.test(out)) {
    out = out.replace(/\b__dirname\b/g, '__dirnameYargs');
  }

  if (out !== src) { fs.writeFileSync(file, out); return true; }
  return false;
}

// yargs itself is not the only offender: its ESM dependencies get bundled too and
// ship the same wrapper-colliding constructs. `yargs-parser/build/lib/index.js`
// uses the guarded `const require = createRequire ? … : undefined` shim, which
// crashes the test server bundle at boot ("Identifier 'require' has already been
// declared"). Scan yargs AND every yargs dependency package that actually contains
// a collision pattern (the rest — cliui, escalade, string-width, y18n, … — are clean
// today but are harmless to include if they gain one later).
const ROOTS = ['yargs', 'yargs-parser', 'cliui', 'escalade', 'get-caller-file', 'require-directory', 'string-width', 'y18n']
  .map(name => path.join('node_modules', name))
  .filter(p => fs.existsSync(p));
try {
  if (!ROOTS.length) process.exit(0);
  const files = ROOTS.reduce((acc, r) => collect(r, acc), []);
  let n = 0;
  for (const f of files) { if (patchFile(f)) n += 1; }
  if (n) console.log('patch-yargs-dirname: made', n, 'yargs file(s) Meteor CommonJS-wrapper safe');
  const leftovers = files.filter(f => {
    try { return /import\.meta/.test(fs.readFileSync(f, 'utf8')); } catch (e) { return false; }
  });
  if (leftovers.length) console.warn('patch-yargs-dirname: WARNING import.meta still in', leftovers.join(', '));
} catch (e) {
  console.warn('patch-yargs-dirname: skipped -', (e && e.message) || e);
}
