'use strict';

// Guard: TenantBleed hardening (maintainer decision 2026-10-02). An
// Organization's own admin could set its tenant hostnames to anything
// unclaimed - the instance's own ROOT_URL host included, which put that
// Organization's branding on everybody's sign-in page. Now:
//   - nobody may claim the instance's own host (an org admin trying is
//     recorded under TenantBleed, medium: it never disables the account);
//   - a site admin assigns hostnames; an org admin's NEW hostname is stored
//     as a request (orgDomainsRequested) until a site admin saves it;
//   - an org admin may still drop hostnames at once.
// Run: node tests/tenantHostApproval.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const src = read('server/methods/tenant.js');
const method = src.slice(src.indexOf('async setOrgTenantFields('), src.indexOf('async listOrgMembers('));

test('the instance host is refused for everyone and recorded for org admins', () => {
  assert.match(method, /const instanceHost = tenants\.normalizeHost\(Meteor\.absoluteUrl\(\)\);/);
  assert.match(method, /if \(instanceHost && hosts\.includes\(instanceHost\)\) \{[\s\S]{0,500}key: 'authz\.tenant', action: 'blocked', source: 'tenant:claim-instance-host'[\s\S]{0,300}throw new Meteor\.Error\('tenant-domain-reserved', instanceHost\);/);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.tenant':\s*\{[^}]*severity: 'medium'/);
});

test('only a site admin assigns a new hostname; dropping one applies at once', () => {
  // The decision itself, as the method makes it.
  const decide = (siteAdmin, current, hosts) => (siteAdmin || hosts.every(h => current.includes(h)) ? 'assign' : 'request');
  assert.equal(decide(false, ['a.example'], ['a.example', 'b.example']), 'request');
  assert.equal(decide(false, ['a.example', 'b.example'], ['a.example']), 'assign');
  assert.equal(decide(false, ['a.example'], []), 'assign');
  assert.equal(decide(true, [], ['b.example']), 'assign');
  assert.match(method, /if \(siteAdmin \|\| hosts\.every\(host => current\.includes\(host\)\)\) \{\n\s*\$set\.orgDomains = hosts\.join\(', '\);\n\s*\$unset\.orgDomainsRequested = 1;\n\s*\} else \{\n\s*requested = hosts\.join\(', '\);\n\s*\$set\.orgDomainsRequested = requested;/);
  // Two orgs still cannot claim one host (negative: the old rule stays).
  assert.match(method, /throw new Meteor\.Error\('tenant-domain-taken', clashes\.join\(', '\)\);/);
});

test('negative: nothing else writes orgDomains', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name.startsWith('_build') || e.name.startsWith('.')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.js$/.test(e.name) ? [rel] : []);
  });
  const writers = ['server', 'models', 'client', 'imports'].flatMap(walk)
    .filter(f => /\$set\.orgDomains =|['"]?orgDomains['"]?\s*:\s*(?!1\b)[^,}\n]+,?\s*$/m.test(read(f)) && /updateAsync|insertAsync|\$set/.test(read(f)))
    .filter(f => !['models/org.js', 'server/publications/org.js', 'server/lib/tenantResolver.js', 'models/lib/tenants.js'].includes(f));
  assert.deepEqual(writers, ['server/methods/tenant.js']);
  // Org's client allow rules do not let anybody write it either.
  const perms = fs.existsSync(path.join(ROOT, 'server/permissions/org.js')) ? read('server/permissions/org.js') : '';
  assert.doesNotMatch(perms, /orgDomains/);
});
