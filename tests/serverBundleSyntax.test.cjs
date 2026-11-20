'use strict';
// The built server bundle must be JavaScript the server can load. On
// 2026-11-20 a function got a parameter named like a const in its own body -
// "Identifier 'h' has already been declared" in the minified bundle - and the
// server died on start, while every node suite passed: none of them loads that
// ES module, so the SyntaxError was only seen when the server ran. When a build is there (_build/ after any Meteor build,
// .build/bundle after `meteor build`), it is checked as Node loads it.
// Run: node --test tests/serverBundleSyntax.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const BUNDLES = ['_build/main-prod/server-rspack.js', '.build/bundle/programs/server/app/app.js'];

test('every built server bundle that exists passes node --check', t => {
  const present = BUNDLES.filter(rel => fs.existsSync(path.join(root, rel)));
  if (!present.length) { t.skip('no build here'); return; }
  for (const rel of present) {
    const r = spawnSync(process.execPath, ['--check', path.join(root, rel)], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, `${rel}: ${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || r.stderr.slice(0, 300)}`);
  }
});
