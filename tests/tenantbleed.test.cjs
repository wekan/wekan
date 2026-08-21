'use strict';

// TenantBleed — GHSA-p4cq-83j9-7g73, CWE-563/CWE-862.
// An ordinary authenticated user could insert, update or remove an Organization
// or Team document whenever its _id equalled their user id. Document identity is
// not tenant administration authority; all six DDP collection operations are
// site-admin only now.
// Run: node tests/tenantbleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const org = read('server/permissions/org.js');
const team = read('server/permissions/team.js');
const helper = read('server/lib/adminCollectionPermission.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tenantbleed:');

for (const [collection, source] of [['Organization', org], ['Team', team]]) {
  for (const operation of ['insert', 'update', 'remove']) {
    test(`${collection} ${operation} is site-admin only`, () => {
      assert.match(source, new RegExp(
        `async ${operation}\\(userId\\) \\{\\s*return allowSiteAdminCollectionMutation\\(userId\\);`,
      ));
    });
  }
}

test('negative: neither collection authorizes by document id', () => {
  for (const source of [org, team]) {
    assert.ok(!source.includes('doc._id'));
    assert.ok(!source.includes('=== userId'));
  }
});

test('the shared helper denies anonymous and ordinary authenticated users', () => {
  assert.match(helper, /if \(!userId\) return false;/);
  assert.match(helper, /if \(user\?\.isAdmin\) return true;/);
  assert.match(helper, /return false;\s*\n\}/);
});

test('a denied authenticated mutation is visible in Admin Panel Problems', () => {
  assert.match(helper,
    /tripCanary\('tenant\.mutate-without-admin', \{ userId \}\)/);
});

test('the decision requests only the site-admin field', () => {
  assert.match(helper, /fields: \{ isAdmin: 1 \}/);
});

console.log(`\ntenantbleed: ${passed} tests passed`);
