'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const patch = path.join(root, 'scripts/patch-pdfkit-entry.cjs');
const project = require('../package.json');
assert.match(project.scripts.postinstall, /patch-pdfkit-entry\.cjs/,
  'every dependency installation applies the portable PDFKit entry');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-pdfkit-entry-'));
const scripts = path.join(temp, 'scripts');
const pdfkit = path.join(temp, 'node_modules', 'pdfkit');
fs.mkdirSync(scripts, { recursive: true });
fs.mkdirSync(pdfkit, { recursive: true });
fs.copyFileSync(patch, path.join(scripts, 'patch-pdfkit-entry.cjs'));

function run(pkg) {
  fs.writeFileSync(path.join(pdfkit, 'package.json'), `${JSON.stringify(pkg)}\n`);
  return spawnSync(process.execPath, [path.join(scripts, 'patch-pdfkit-entry.cjs')], {
    cwd: temp, encoding: 'utf8',
  });
}

const result = run({ exports: { '.': { node: {
  import: './js/pdfkit.node.mjs', require: './js/pdfkit.js',
} } } });
assert.equal(result.status, 0, result.stderr);
const patched = JSON.parse(fs.readFileSync(path.join(pdfkit, 'package.json')));
assert.equal(patched.exports['.'].node.import, './js/pdfkit.js');
assert.equal(patched.exports['.'].node.require, './js/pdfkit.js');

const changed = run({ exports: { '.': { node: {
  import: './new.mjs', require: './new.cjs',
} } } });
assert.notEqual(changed.status, 0,
  'an unknown PDFKit layout must stop installation instead of silently mispatching');

fs.rmSync(temp, { recursive: true, force: true });
console.log('pdfkitEntryPatch: portable entry and unknown-layout refusal passed');
