'use strict';

// GHSA-xcx6-jx8p-x3h5: @azure/msal-node >= 5.0.0-beta.0, < 7.1.0 may disclose
// authorization code flow parameters to an attacker-controlled endpoint. It
// reached WeKan only through @tweedegolf/sab-adapter-azure-blob ->
// @azure/identity, the Microsoft Entra passwordless sign-in that adapter loaded
// and WeKan never used, and package.json overrode it to ^7.1.1. Azure Blob
// storage is now WeKan's own adapter on @azure/storage-blob alone
// (server/lib/azureBlobAdapter.js), so neither MSAL nor @azure/identity is a
// dependency at all, and the override went with them. This pins that: a
// package that brings MSAL back brings this advisory back with it.
// Run: node tests/msalNodeAdvisory.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('msalNodeAdvisory:');

test('negative: no @azure/identity or MSAL package is locked', () => {
  const copies = Object.keys(lock.packages || {})
    .filter(k => /(^|\/)node_modules\/@azure\/(identity|msal-[a-z]+)$/.test(k));
  assert.deepEqual(copies, [], 'Azure Blob storage needs @azure/storage-blob only');
});

test('negative: the package that brought them is not a dependency, and nothing needs the override', () => {
  assert.ok(!('@tweedegolf/sab-adapter-azure-blob' in (pkg.dependencies || {})));
  assert.ok(!(pkg.overrides && '@azure/msal-node' in pkg.overrides));
  assert.ok('@azure/storage-blob' in pkg.dependencies, 'Azure Blob storage is still there');
});

console.log(`msalNodeAdvisory: ${passed} passed`);
