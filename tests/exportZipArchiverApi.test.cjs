'use strict';

// Board export -> .zip (with attachments) answered a bare "500 Internal
// Server Error" with no body, on every request, for every board.
//
// Root cause: models/server/ExporterZip.js called the archiver package the
// v7 way - `const archiver = require('archiver'); archiver('zip', {...})`.
// archiver@8 (package.json pins ^8.0.0) is ESM-only and exports the classes
// { Archiver, ZipArchive, TarArchive, JsonArchive } - no callable default -
// so `archiver('zip', {...})` threw `TypeError: archiver is not a function`
// synchronously, before models/export.js' exportZip route had written any
// response header. safeRoute (server/apiMiddleware.js) then answered a plain
// 500 with no board-specific detail, matching the reporter's browser-level
// "500 Internal Server Error" page.
//
// server/methods/backup.js hit the identical break earlier (see its own
// "archiver@8 is ESM" comment) and already fixed it with
// `import { ZipArchive } from 'archiver'; new ZipArchive({...})`.
// ExporterZip.js was missed. Fixed the same way here.
//
// Run: node tests/exportZipArchiverApi.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('exportZipArchiverApi:');

const exporterZip = read('models/server/ExporterZip.js');

test('ExporterZip imports the ZipArchive class from archiver', () => {
  assert.match(exporterZip, /import\s*\{\s*ZipArchive\s*\}\s*from\s*'archiver'/);
});

test('ExporterZip constructs `new ZipArchive(...)`, not the old factory call', () => {
  assert.match(exporterZip, /new ZipArchive\(\s*\{\s*zlib:/);
});

test('the old `require(\'archiver\')(...)` factory call is gone (negative)', () => {
  assert.doesNotMatch(exporterZip, /require\(\s*['"]archiver['"]\s*\)\s*\(/);
});

// The same break could exist anywhere else that zips a stream server-side.
// Scan every server-side source file (not node_modules, not the rspack/Meteor
// build output, not this test itself) for the same dead API shape, so a
// second call site cannot reintroduce the bug this test would otherwise miss.
test('nothing else in the tree still calls archiver as a v7 factory (negative)', () => {
  const skipDirs = new Set([
    'node_modules', '.git', '.tools', '.build', '_build', '.meteor',
  ]);
  const offenders = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|cjs|mjs)$/.test(entry.name)) continue;
      if (full === path.join(root, 'tests', 'exportZipArchiverApi.test.cjs')) continue;
      const text = fs.readFileSync(full, 'utf8');
      // A real call, not a comment naming the dead shape (both existing fixes
      // document it in prose - match the call syntax, require parens included).
      if (/require\(\s*['"]archiver['"]\s*\)\s*\(\s*['"]zip['"]/.test(text)) {
        offenders.push(full);
      }
    }
  })(root);
  assert.deepStrictEqual(offenders, [], `still call archiver('zip', ...) via require(): ${offenders.join(', ')}`);
});

console.log(`\nexportZipArchiverApi: ${passed} tests passed`);
