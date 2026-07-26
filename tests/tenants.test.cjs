'use strict';
// The pure modules are ES modules (every app file is one in Meteor), so they are
// loaded with a dynamic import - the same way tests/cardUrl.test.cjs loads its module.
(async () => {

// Multitenancy option D — host → Organization resolution and per-tenant branding.
// Plain Node, no Meteor: models/lib/tenants.js is pure on purpose, because this is
// the decision a cross-tenant mistake would come from.
// Run: node tests/tenants.test.cjs
//
// See docs/Design/Multitenancy/Multitenancy.md (D.2, D.3, D.9).

const assert = require('assert');
const {
  brandingOrgFields,
  conflictingHosts,
  duplicateTenantHosts,
  findTenantOrg,
  hostsOfOrg,
  isTenancyEnabled,
  normalizeHost,
  parseHostList,
  requestHost,
  tenantBranding,
  tenantBrandingOverrides,
  tenantRootUrl,
  trustsProxyHost,
} = await import('../models/lib/tenants.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tenants:');

// ── normalizeHost ────────────────────────────────────────────────────────────

test('normalizeHost lower-cases and drops the port', () => {
  assert.strictEqual(normalizeHost('A.Example.COM:8080'), 'a.example.com');
  assert.strictEqual(normalizeHost('  a.example.com  '), 'a.example.com');
});

test('normalizeHost accepts a whole URL, so a pasted address still works', () => {
  assert.strictEqual(normalizeHost('https://A.Example.com/boards/x'), 'a.example.com');
  assert.strictEqual(normalizeHost('http://user:pw@a.example.com:3000/'), 'a.example.com');
});

test('normalizeHost drops the trailing root dot', () => {
  // "a.example.com." is the SAME host in DNS, and a browser may send it.
  assert.strictEqual(normalizeHost('a.example.com.'), 'a.example.com');
});

test('normalizeHost keeps an IPv6 literal in its brackets', () => {
  assert.strictEqual(normalizeHost('[2001:db8::1]:3000'), '[2001:db8::1]');
});

test('normalizeHost returns "" for nothing usable', () => {
  assert.strictEqual(normalizeHost(''), '');
  assert.strictEqual(normalizeHost('   '), '');
  assert.strictEqual(normalizeHost(undefined), '');
  assert.strictEqual(normalizeHost(null), '');
  assert.strictEqual(normalizeHost(42), '');
});

// ── parseHostList ────────────────────────────────────────────────────────────

test('parseHostList splits on commas, semicolons and whitespace', () => {
  assert.deepStrictEqual(
    parseHostList('a.example.com, b.example.com;c.example.com\n  d.example.com'),
    ['a.example.com', 'b.example.com', 'c.example.com', 'd.example.com']);
});

test('parseHostList normalises and de-duplicates', () => {
  assert.deepStrictEqual(parseHostList('A.Example.com:443, a.example.com, '),
    ['a.example.com']);
  assert.deepStrictEqual(parseHostList(''), []);
  assert.deepStrictEqual(parseHostList(undefined), []);
});

test('parseHostList accepts an array as well as a string', () => {
  assert.deepStrictEqual(parseHostList(['A.example.com', 'b.example.com']),
    ['a.example.com', 'b.example.com']);
});

// ── requestHost: the security decision ───────────────────────────────────────

test('requestHost reads the Host header by default', () => {
  assert.strictEqual(requestHost({ host: 'a.example.com:3000' }), 'a.example.com');
});

test('requestHost IGNORES X-Forwarded-Host unless the deployment trusts the proxy', () => {
  // The attack: a client sends X-Forwarded-Host for someone else's tenant, and is
  // handed that tenant's branding. Off by default, so it cannot happen by accident.
  const headers = { host: 'a.example.com', 'x-forwarded-host': 'b.example.com' };
  assert.strictEqual(requestHost(headers), 'a.example.com');
  assert.strictEqual(requestHost(headers, { trustProxy: false }), 'a.example.com');
  assert.strictEqual(requestHost(headers, { trustProxy: true }), 'b.example.com');
});

test('requestHost takes the FIRST entry of a proxy chain', () => {
  const headers = { 'x-forwarded-host': 'a.example.com, proxy1.internal, proxy2.internal' };
  assert.strictEqual(requestHost(headers, { trustProxy: true }), 'a.example.com');
});

test('requestHost falls back to Host when the trusted proxy header is absent', () => {
  assert.strictEqual(requestHost({ host: 'a.example.com' }, { trustProxy: true }),
    'a.example.com');
});

test('requestHost tolerates an array header value and a mixed-case key', () => {
  assert.strictEqual(requestHost({ Host: ['a.example.com'] }), 'a.example.com');
});

test('requestHost returns "" for no headers at all', () => {
  assert.strictEqual(requestHost(undefined), '');
  assert.strictEqual(requestHost({}), '');
  assert.strictEqual(requestHost('not headers'), '');
});

// ── findTenantOrg ────────────────────────────────────────────────────────────

const ORG_A = { _id: 'orgA', orgIsActive: true, orgDomains: 'a.example.com, alias.example.com' };
const ORG_B = { _id: 'orgB', orgIsActive: true, orgDomains: 'b.example.com' };
const ORG_OFF = { _id: 'orgOff', orgIsActive: false, orgDomains: 'off.example.com' };
const ORG_PLAIN = { _id: 'orgPlain', orgIsActive: true };

test('findTenantOrg finds the org that claims the host, by any of its names', () => {
  const orgs = [ORG_A, ORG_B, ORG_OFF, ORG_PLAIN];
  assert.strictEqual(findTenantOrg(orgs, 'a.example.com'), ORG_A);
  assert.strictEqual(findTenantOrg(orgs, 'ALIAS.Example.com:443'), ORG_A);
  assert.strictEqual(findTenantOrg(orgs, 'b.example.com'), ORG_B);
});

test('findTenantOrg returns null for a host nobody claims', () => {
  // The instance's own ROOT_URL is the normal case: no tenant, instance branding.
  assert.strictEqual(findTenantOrg([ORG_A, ORG_B], 'wekan.example.com'), null);
  assert.strictEqual(findTenantOrg([ORG_A], ''), null);
  assert.strictEqual(findTenantOrg(null, 'a.example.com'), null);
});

test('an INACTIVE org is not a tenant, so deactivating takes it off the air', () => {
  assert.strictEqual(findTenantOrg([ORG_OFF], 'off.example.com'), null);
});

test('a subdomain does NOT match a tenant host (exact hosts only)', () => {
  assert.strictEqual(findTenantOrg([ORG_A], 'sub.a.example.com'), null);
  assert.strictEqual(findTenantOrg([ORG_A], 'xa.example.com'), null);
});

test('hostsOfOrg lists what one org claims', () => {
  assert.deepStrictEqual(hostsOfOrg(ORG_A), ['a.example.com', 'alias.example.com']);
  assert.deepStrictEqual(hostsOfOrg(ORG_PLAIN), []);
  assert.deepStrictEqual(hostsOfOrg(null), []);
});

// ── duplicate hosts ──────────────────────────────────────────────────────────

test('duplicateTenantHosts names a host two orgs claim', () => {
  const clash = { _id: 'orgC', orgIsActive: true, orgDomains: 'a.example.com' };
  assert.deepStrictEqual(duplicateTenantHosts([ORG_A, clash]),
    { 'a.example.com': ['orgA', 'orgC'] });
  assert.deepStrictEqual(duplicateTenantHosts([ORG_A, ORG_B]), {});
});

test('conflictingHosts refuses a host another org already claims, but not your own', () => {
  const others = [ORG_A, ORG_B];
  assert.deepStrictEqual(conflictingHosts(others, 'orgNew', 'a.example.com'),
    ['a.example.com']);
  // Saving orgA's own hosts back onto orgA is not a conflict.
  assert.deepStrictEqual(conflictingHosts(others, 'orgA', 'a.example.com'), []);
  assert.deepStrictEqual(conflictingHosts(others, 'orgNew', 'new.example.com'), []);
});

// ── branding ─────────────────────────────────────────────────────────────────

const SETTING = {
  productName: 'WeKan',
  customLoginLogoImageUrl: 'https://instance.example.com/logo.png',
  legalNotice: 'https://instance.example.com/legal',
  hideLogo: true,
};

test('tenantBranding overrides only what the org actually sets', () => {
  const org = { _id: 'orgA', orgProductName: 'Acme Boards' };
  const merged = tenantBranding(org, SETTING);
  assert.strictEqual(merged.productName, 'Acme Boards');
  // Untouched fields keep the instance value…
  assert.strictEqual(merged.customLoginLogoImageUrl, SETTING.customLoginLogoImageUrl);
  // …and fields that are not branding at all are carried through unchanged.
  assert.strictEqual(merged.hideLogo, true);
});

test('an empty or blank org value does NOT blank the instance value', () => {
  const org = { orgProductName: '   ', orgLegalNotice: '' };
  const merged = tenantBranding(org, SETTING);
  assert.strictEqual(merged.productName, 'WeKan');
  assert.strictEqual(merged.legalNotice, 'https://instance.example.com/legal');
});

test('no tenant means the instance document, unchanged', () => {
  assert.deepStrictEqual(tenantBranding(null, SETTING), SETTING);
  assert.notStrictEqual(tenantBranding(null, SETTING), SETTING, 'a copy, not the same object');
});

test('tenantBranding never mutates the settings document it was given', () => {
  const setting = { ...SETTING };
  tenantBranding({ orgProductName: 'Acme' }, setting);
  assert.strictEqual(setting.productName, 'WeKan');
});

test('tenantBrandingOverrides returns only the fields that differ', () => {
  assert.deepStrictEqual(
    tenantBrandingOverrides({ orgProductName: 'Acme', orgCustomHelpLinkUrl: '' }),
    { productName: 'Acme' });
  assert.deepStrictEqual(tenantBrandingOverrides(null), {});
});

test('every branding field is an org field the schema can carry', () => {
  const fields = brandingOrgFields();
  assert.ok(fields.includes('orgProductName'));
  assert.ok(fields.every(f => f.startsWith('org')), 'org-prefixed, like every other org field');
  const org = require('fs').readFileSync(require('path').join(__dirname, '..', 'models/org.js'), 'utf8');
  fields.forEach(field => {
    assert.ok(new RegExp(`\\n\\s{4}${field}:`).test(org), `${field} must exist in the Org schema`);
  });
});

// ── root URL ─────────────────────────────────────────────────────────────────

test('tenantRootUrl keeps the scheme of the instance ROOT_URL', () => {
  assert.strictEqual(tenantRootUrl('a.example.com', 'https://wekan.example.com/'),
    'https://a.example.com/');
  assert.strictEqual(tenantRootUrl('a.example.com', 'http://localhost:3000/'),
    'http://a.example.com/');
});

test('tenantRootUrl keeps a sub-path deployment sub-path', () => {
  assert.strictEqual(tenantRootUrl('a.example.com', 'https://wekan.example.com/kanban'),
    'https://a.example.com/kanban/');
  assert.strictEqual(tenantRootUrl('a.example.com', 'https://wekan.example.com/kanban/'),
    'https://a.example.com/kanban/');
});

test('tenantRootUrl falls back to the instance ROOT_URL when there is no host', () => {
  assert.strictEqual(tenantRootUrl('', 'https://wekan.example.com/'),
    'https://wekan.example.com/');
});

test('tenantRootUrl defaults to https when ROOT_URL is unusable', () => {
  assert.strictEqual(tenantRootUrl('a.example.com', ''), 'https://a.example.com/');
  assert.strictEqual(tenantRootUrl('a.example.com', undefined), 'https://a.example.com/');
});

// ── the switch ───────────────────────────────────────────────────────────────

test('tenancy is OFF unless the deployment turns it on', () => {
  assert.strictEqual(isTenancyEnabled({}), false);
  assert.strictEqual(isTenancyEnabled({ MULTITENANCY: 'false' }), false);
  assert.strictEqual(isTenancyEnabled({ MULTITENANCY: '' }), false);
  assert.strictEqual(isTenancyEnabled(undefined), false);
  assert.strictEqual(isTenancyEnabled({ MULTITENANCY: 'true' }), true);
  assert.strictEqual(isTenancyEnabled({ MULTITENANCY: ' TRUE ' }), true);
  assert.strictEqual(isTenancyEnabled({ MULTITENANCY: '1' }), true);
});

test('trusting the proxy host is a separate, also-off-by-default switch', () => {
  assert.strictEqual(trustsProxyHost({ MULTITENANCY: 'true' }), false);
  assert.strictEqual(trustsProxyHost({ MULTITENANCY_TRUST_PROXY_HOST: 'true' }), true);
});

console.log(`\n${passed} tests passed`);

})();
