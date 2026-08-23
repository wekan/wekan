#!/usr/bin/env node
'use strict';

// ---------------------------------------------------------------------------
// Jalor: vendor the OFFICIAL DSFR (Systeme de Design de l'Etat) into public/dsfr/
//
// Why vendored rather than bundled: the DSFR stylesheet loads its own fonts and
// icons with RELATIVE url() references (fonts/Marianne-Regular.woff2,
// ../../icons/system/check-line.svg). Running it through the Meteor/rspack CSS
// pipeline rewrites or breaks those paths; serving the untouched dist files from
// public/ keeps the DSFR exactly as its maintainers published it, so updating is
// "bump the version, re-run this script" and never "re-apply our patches".
//
//   node scripts/vendor-dsfr.mjs
//
// It reads @gouvfr/dsfr from node_modules (declared in package.json), so the
// version shipped is the version installed - there is one place to bump.
//
// The icon sheet is the one thing that is NOT copied whole: the DSFR ships 1088
// icons (4.2 MB, 1088 files) and Jalor keeps WeKan's Font Awesome for the app's
// own icons, using DSFR icons only in the Jalor chrome. So this script scans the
// source for `fr-icon-<name>` and emits a sheet holding exactly those icons,
// with their SVG files. tests/jalorDsfrIcons.test.cjs fails when the source uses
// an icon the vendored sheet does not carry, which is the reminder to re-run it.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(repoRoot, 'node_modules', '@gouvfr', 'dsfr');
// Two destinations, because the two halves are consumed differently:
//   client/jalor/vendor/  the stylesheets, imported FIRST by client/styles.js so
//                         the DSFR's element reset lands BEFORE WeKan's own CSS
//                         and WeKan keeps winning every rule the two share;
//   public/dsfr/          the fonts and icon SVGs, served as static files at the
//                         absolute /dsfr/... paths the stylesheets point at.
const cssOut = path.join(repoRoot, 'client', 'jalor', 'vendor');
const assetOut = path.join(repoRoot, 'public', 'dsfr');

// Directories scanned for `fr-icon-<name>` usage.
const SCAN_DIRS = ['client', 'imports', 'models', 'server', 'config', 'packages'];
const SCAN_EXT = new Set(['.jade', '.js', '.mjs', '.cjs', '.css', '.html', '.json', '.md']);

// Icons Jalor always ships even when no template mentions them yet: they are the
// ones a DSFR page is expected to have available (close, back, external link),
// so a component added later does not silently render an empty square.
const ALWAYS_ICONS = [
  'fr-icon-close-line',
  'fr-icon-arrow-left-line',
  'fr-icon-arrow-right-line',
  'fr-icon-external-link-line',
];

function fail(msg) {
  console.error(`vendor-dsfr: ${msg}`);
  process.exit(1);
}

function readPkgVersion() {
  const p = path.join(srcRoot, 'package.json');
  if (!fs.existsSync(p)) {
    fail(`@gouvfr/dsfr is not installed. Run: npm install`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')).version;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    // The vendored sheets name every icon they carry. Scanning them would make
    // the icon set self-perpetuating: nothing could ever be dropped again.
    if (e.name === 'vendor' && path.basename(dir) === 'jalor') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

export function collectUsedIcons(root = repoRoot, dirs = SCAN_DIRS) {
  const found = new Set(ALWAYS_ICONS);
  for (const d of dirs) {
    for (const file of walk(path.join(root, d))) {
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/fr-icon-[a-z0-9-]+/g)) found.add(m[0]);
    }
  }
  // `fr-icon-` on its own is the prefix, not an icon.
  found.delete('fr-icon-');
  return [...found].sort();
}

// Split a CSS string into top-level chunks: either a plain rule
// ("selectors{decls}") or an at-rule block ("@media ...{ ... }"). Brace
// counting is enough here - the DSFR dist has no braces inside strings apart
// from data: URIs, which live inside url(...) and are balanced.
function splitTopLevel(css) {
  const chunks = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        chunks.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  if (start < css.length) chunks.push(css.slice(start));
  return chunks;
}

// A chunk belongs to an icon when its selector list mentions `.fr-icon-<name>`.
// A chunk mentioning none is generic (sizing, the `fr-icon--sm` modifiers) and
// is always kept.
function iconsOfSelector(selectorText) {
  return [...selectorText.matchAll(/\.(fr-icon-[a-z0-9-]+)/g)].map((m) => m[1]);
}

function filterIconCss(css, keep) {
  const out = [];
  for (const chunk of splitTopLevel(css)) {
    const open = chunk.indexOf('{');
    if (open === -1) {
      // Trailing whitespace or a comment - keep the licence banner, drop noise.
      if (chunk.trim()) out.push(chunk);
      continue;
    }
    const head = chunk.slice(0, open);
    if (head.trimStart().startsWith('@')) {
      const body = chunk.slice(open + 1, chunk.lastIndexOf('}'));
      const inner = filterIconCss(body, keep);
      if (inner.trim()) out.push(`${head}{${inner}}`);
      continue;
    }
    const icons = iconsOfSelector(head);
    if (icons.some((n) => keep.has(n))) {
      out.push(chunk);
      continue;
    }
    if (icons.length > 0) continue;
    // A rule naming no icon class is either generic sizing (kept) or a component
    // of the DSFR that Jalor does not use but that points at an icon file anyway
    // - the social-network buttons, the rich-text editor toolbar. Those would
    // drag in icons nothing displays, so they go.
    if (/icons\/[^)]+\.svg/.test(chunk)) continue;
    out.push(chunk);
  }
  return out.join('');
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function main() {
  const version = readPkgVersion();
  const dist = path.join(srcRoot, 'dist');
  if (!fs.existsSync(dist)) fail(`${dist} is missing`);

  fs.rmSync(cssOut, { recursive: true, force: true });
  fs.rmSync(assetOut, { recursive: true, force: true });
  fs.mkdirSync(cssOut, { recursive: true });
  fs.mkdirSync(assetOut, { recursive: true });

  // The banner goes AFTER a leading `@charset`, never before it: `@charset` is
  // only honoured as the very first bytes of a stylesheet, and a comment in
  // front of it turns it into a no-op.
  const withBanner = (css, what) => {
    const m = css.match(/^@charset [^;]+;\s*/);
    return m ? m[0] + banner(what) + css.slice(m[0].length) : banner(what) + css;
  };

  const banner = (what) =>
    `/* DSFR ${version} - ${what}.\n` +
    ` * Vendored by scripts/vendor-dsfr.mjs from the npm package @gouvfr/dsfr.\n` +
    ` * DO NOT EDIT: re-run the script instead. Licence: public/dsfr/DSFR-LICENSE.md.\n` +
    ` * The only change made here is that relative url() paths are rewritten to the\n` +
    ` * absolute /dsfr/... paths the files are served from, so the sheet can be\n` +
    ` * bundled by rspack without its font and icon references being resolved as\n` +
    ` * modules (see the css-loader rule in rspack.config.js). */\n`;

  // 1. The stylesheet, with only its url() paths repointed. It names its fonts
  //    AND about sixty icons of its own - the ones its components draw without
  //    being asked for an icon class: the checkbox tick, the alert marks, the
  //    accordion caret, the pagination arrows, the external-link glyph.
  const core = fs
    .readFileSync(path.join(dist, 'dsfr.min.css'), 'utf8')
    .replace(/url\((["']?)fonts\//g, 'url($1/dsfr/fonts/')
    .replace(/url\((["']?)icons\//g, 'url($1/dsfr/icons/');
  fs.writeFileSync(
    path.join(cssOut, 'dsfr.min.css'),
    withBanner(core, 'core, components and utilities'),
  );

  // 2. Marianne and Spectral.
  const fontsDir = path.join(dist, 'fonts');
  for (const f of fs.readdirSync(fontsDir)) {
    copyFile(path.join(fontsDir, f), path.join(assetOut, 'fonts', f));
  }

  // 3. The icons actually used, and only those.
  const used = collectUsedIcons();
  const keep = new Set(used);
  const iconCssPath = path.join(dist, 'utility', 'icons', 'icons.min.css');
  const filtered = filterIconCss(fs.readFileSync(iconCssPath, 'utf8'), keep).replace(
    /\.\.\/\.\.\/icons\//g,
    '/dsfr/icons/',
  );
  fs.writeFileSync(
    path.join(cssOut, 'dsfr.icons.css'),
    `${withBanner(filtered, 'icon sheet, trimmed to the icons Jalor uses')}\n`,
  );

  // 4. Every icon file either sheet points at - the ones the core sheet's own
  //    components draw, and the ones the trimmed icon sheet carries.
  const missing = [];
  const copied = new Set();
  for (const sheet of [core, filtered]) {
    for (const m of sheet.matchAll(/url\(["']?\/dsfr\/(icons\/[^)"']+\.svg)["']?\)/g)) {
      const rel = m[1];
      const from = path.join(dist, rel);
      if (!fs.existsSync(from)) {
        missing.push(rel);
        continue;
      }
      copyFile(from, path.join(assetOut, rel));
      copied.add(rel);
    }
  }

  // 5. Licence and version, so what is vendored says where it came from.
  const licence = path.join(srcRoot, 'LICENSE.md');
  if (fs.existsSync(licence)) copyFile(licence, path.join(assetOut, 'DSFR-LICENSE.md'));
  const cgu = path.join(srcRoot, 'doc', 'legal', 'cgu.md');
  if (fs.existsSync(cgu)) copyFile(cgu, path.join(assetOut, 'DSFR-CGU.md'));
  fs.writeFileSync(
    path.join(assetOut, 'VERSION'),
    `${version}\n\nVendored from the npm package @gouvfr/dsfr by scripts/vendor-dsfr.mjs.\n` +
      `Do not edit anything in this directory, or in client/jalor/vendor/, by hand -\n` +
      `bump the version in package.json and re-run the script instead.\n`,
  );

  console.log(`vendor-dsfr: DSFR ${version}`);
  console.log(`vendor-dsfr:   client/jalor/vendor/dsfr.min.css, dsfr.icons.css`);
  console.log(`vendor-dsfr:   public/dsfr/ - ${fs.readdirSync(path.join(assetOut, 'fonts')).length} font files, ${copied.size} icon files`);
  console.log(`vendor-dsfr:   ${used.length} icon classes in use`);
  if (missing.length) fail(`these icons are not in the DSFR: ${missing.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
