'use strict';

// AuthBleed (https://wekan.fi/hall-of-fame/authbleed/): getServiceConfiguration
// ("oidc") returned the whole OIDC configuration to any caller, client secret
// included. It returns the public part now. The copy/move findings of the same
// entry are tests/authBleedCopyMethods.test.cjs.
// Run: node tests/authBleedServiceConfiguration.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

// The real method, cut out of server/models/settings.js and run with a stub.
const settings = read('server/models/settings.js');
const start = settings.indexOf('async getServiceConfiguration(service) {');
const body = settings.slice(start, settings.indexOf('\n  },', start) + 4);
const method = new Function('check', 'loadOidcConfig', `return ({ ${body} }).getServiceConfiguration;`)(
  () => {},
  async service => (service === 'oidc' ? { clientId: 'id', secret: 'TOP-SECRET', loginStyle: 'redirect', serverUrl: 'https://idp' } : null),
);

test('the OIDC configuration comes back without its client secret', async () => {
  const config = await method('oidc');
  assert.strictEqual(config.clientId, 'id');
  assert.strictEqual(config.loginStyle, 'redirect');
  assert.ok(!('secret' in config), 'no secret');
  assert.ok(!JSON.stringify(config).includes('TOP-SECRET'));
  assert.strictEqual(await method('nope'), null);
});

test('negative: nothing else hands a service configuration with its secret to a client', () => {
  // Every server Meteor method or publication that reads a service
  // configuration must leave the secret out.
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', 'tests', '.npm'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of [...walk('server'), ...walk('packages')]) {
    const src = read(file);
    // A publication of the raw configurations collection with its secrets.
    assert.ok(!/Meteor\.publish\([^)]*\)[\s\S]{0,400}ServiceConfiguration\.configurations\.find\((\{\s*\}|)\)/.test(src),
      `${file}: publishes service configurations unfiltered`);
    for (const m of src.matchAll(/loadOidcConfig\(/g)) {
      const around = src.slice(m.index, m.index + 600);
      if (/return\s+config\s*;/.test(around.split('\n  },')[0])) {
        assert.fail(`${file}: returns a loaded OIDC config whole`);
      }
    }
  }
});

(async () => {
  let passed = 0;
  console.log('authBleedServiceConfiguration:');
  for (const [name, fn] of pending) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`authBleedServiceConfiguration: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
