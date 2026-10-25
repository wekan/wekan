'use strict';

// GHSA-xcx6-jx8p-x3h5: @azure/msal-node >= 5.0.0-beta.0, < 7.1.0 may disclose
// authorization code flow parameters to an attacker-controlled endpoint. It
// reaches WeKan through @tweedegolf/sab-adapter-azure-blob -> @azure/identity,
// whose newest release (4.14.0, and 4.15.0-beta.1) still asks for
// msal-node ^6.0.0, so `npm audit fix` - forced or not - could not apply it.
// package.json overrides it to ^7.1.1; 7.0.0's only breaking change removed
// responseMode from acquireTokenInteractive, which @azure/identity never
// passes. This pins the override and that no vulnerable copy is locked.
// Run: node tests/msalNodeAdvisory.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const parse = v => v.split(/[.-]/).slice(0, 3).map(n => Number.parseInt(n, 10));
const atLeast = (v, min) => {
  const a = parse(v), b = parse(min);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

console.log('msalNodeAdvisory:');

test('package.json overrides @azure/msal-node to a fixed version', () => {
  const o = pkg.overrides && pkg.overrides['@azure/msal-node'];
  assert.ok(o, 'the override is there');
  assert.ok(atLeast(o.replace(/^[\^~>=]+/, ''), '7.1.0'), o);
});

test('negative: no locked copy of @azure/msal-node is in the vulnerable range', () => {
  const copies = Object.entries(lock.packages || {})
    .filter(([k]) => /(^|\/)node_modules\/@azure\/msal-node$/.test(k));
  assert.ok(copies.length >= 1, 'it is in the lock file');
  for (const [k, v] of copies) assert.ok(atLeast(v.version, '7.1.0'), `${k} ${v.version}`);
});

console.log(`msalNodeAdvisory: ${passed} passed`);
