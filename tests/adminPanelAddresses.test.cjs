'use strict';

// Admin Panel / Settings / Privacy and security / Allowed addresses
// (models/lib/adminPanelAddresses.js, server/adminPanelAddresses.js,
// docs/Features/Admin-Panel/Admin-Panel-Allowed-Addresses.md): the IPv4 and
// IPv6 addresses and CIDR ranges the Admin Panel and the admin REST API can be
// used from. From any other address a site administrator reads as a member.
// Run: node tests/adminPanelAddresses.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../models/lib/adminPanelAddresses.js');
const { resolveClientKey } = require('../server/lib/loginAttemptThrottle.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A small MongoDB matcher for the operators a user query and the rewrite use,
// so the rewritten selectors are tested by what they MATCH, not by their shape.
function matches(doc, sel) {
  if (typeof sel === 'string') return doc._id === sel;
  return Object.entries(sel).every(([key, cond]) => {
    if (key === '$and') return cond.every(s => matches(doc, s));
    if (key === '$or') return cond.some(s => matches(doc, s));
    if (key === '$nor') return !cond.some(s => matches(doc, s));
    return fieldMatches(doc[key], cond);
  });
}
function fieldMatches(value, cond) {
  if (cond === null || typeof cond !== 'object' || Array.isArray(cond)) return value === cond || (cond === null && value === undefined);
  return Object.entries(cond).every(([op, v]) => {
    switch (op) {
      case '$eq': return value === v;
      case '$ne': return value !== v;
      case '$in': return v.includes(value);
      case '$nin': return !v.includes(value);
      case '$exists': return (value !== undefined) === !!v;
      case '$not': return !fieldMatches(value, v);
      default: throw new Error(`test matcher: ${op}`);
    }
  });
}
const USERS = [
  { _id: 'outsideAdmin', isAdmin: true, username: 'outside' },
  { _id: 'otherAdmin', isAdmin: true, username: 'other' },
  { _id: 'member', username: 'member' },
  { _id: 'demoted', isAdmin: false, username: 'demoted' },
];
const findOne = (sel, callerId) => USERS.find(u => matches(u, P.restrictSelector(sel, callerId))) || null;
const find = (sel, callerId) => USERS.filter(u => matches(u, P.restrictSelector(sel, callerId))).map(u => u._id);

test('IPv4, IPv6, CIDR ranges and IPv4-mapped IPv6 - the Cloud Panel rules, shared', () => {
  const list = P.normalizeAllowedAddresses('192.168.1.0/24\n2001:db8::/32, 198.51.100.7');
  assert.deepEqual(list, ['192.168.1.0/24', '2001:db8::/32', '198.51.100.7']);
  assert.equal(P.addressAllowed('192.168.1.42', list), true);
  assert.equal(P.addressAllowed('::ffff:192.168.1.42', list), true, 'a dual-stack socket reports an IPv4 client mapped');
  assert.equal(P.addressAllowed('2001:db8:1::5', list), true);
  assert.equal(P.addressAllowed('198.51.100.7', list), true);
  for (const outside of ['192.168.2.1', '198.51.100.8', '2001:db9::1', '::ffff:10.0.0.1', 'unknown', '', undefined]) {
    assert.equal(P.addressAllowed(outside, list), false, `negative: ${outside} is not allowed`);
  }
  assert.equal(P.addressAllowed('203.0.113.1', []), true, 'no list: any address');
  assert.match(read('models/lib/adminPanelAddresses.js'), /require\('\.\/cloudAddresses'\)/, 'one set of address rules, not two');
});

test('the address is the one HTTP_FORWARDED_COUNT trusts, not what the client claims', () => {
  const headers = { 'x-forwarded-for': '192.168.1.5, 10.0.0.2' };
  assert.equal(resolveClientKey({ headers, socketAddress: '10.0.0.9', forwardedCount: '1' }), '10.0.0.2');
  assert.equal(resolveClientKey({ headers, socketAddress: '10.0.0.9', forwardedCount: '2' }), '192.168.1.5');
  assert.equal(resolveClientKey({ headers, socketAddress: '10.0.0.9', forwardedCount: undefined }), '10.0.0.9',
    'negative: without HTTP_FORWARDED_COUNT a forged X-Forwarded-For is ignored');
  const server = read('server/adminPanelAddresses.js');
  assert.match(server, /resolveClientKey\(\{[\s\S]*?forwardedCount: process\.env\.HTTP_FORWARDED_COUNT/);
  assert.ok(!/\[['"]x-forwarded-for['"]\]/i.test(server), 'negative: no header parsing of its own');
});

test('the server environment wins: a list, "any", or the Admin Panel list', () => {
  assert.equal(P.envOverride({}), null);
  assert.equal(P.envOverride({ ADMIN_PANEL_ALLOWED_IP_ADDRESSES: '  ' }), null);
  assert.deepEqual(P.effectiveList(['10.0.0.0/8'], {}), { list: ['10.0.0.0/8'], source: 'settings' });
  assert.deepEqual(P.effectiveList(['10.0.0.0/8'], { ADMIN_PANEL_ALLOWED_IP_ADDRESSES: 'ANY' }), { list: [], source: 'env-any' });
  assert.deepEqual(P.effectiveList(['10.0.0.0/8'], { ADMIN_PANEL_ALLOWED_IP_ADDRESSES: '192.168.0.0/16, ::1' }),
    { list: ['192.168.0.0/16', '::1'], source: 'env' });
  const typo = P.envOverride({ ADMIN_PANEL_ALLOWED_IP_ADDRESSES: '192.168.0.0/33' });
  assert.deepEqual(typo.invalid, ['192.168.0.0/33']);
  assert.equal(P.addressAllowed('192.168.0.1', typo.list), false, 'negative: a mistyped list refuses rather than allows');
  assert.deepEqual(P.effectiveList(null, {}).list, []);
});

test('saving: refused when the list does not have the saver\'s own address', () => {
  assert.deepEqual(P.saveDecision('192.168.1.0/24', '192.168.1.9'), { ok: true, list: ['192.168.1.0/24'] });
  assert.deepEqual(P.saveDecision('', '203.0.113.1'), { ok: true, list: [] }, 'clearing the list is always allowed');
  const locked = P.saveDecision('192.168.1.0/24', '203.0.113.1');
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, 'lockout');
  assert.match(locked.message, /203\.0\.113\.1 is not in the list/);
  assert.equal(P.saveDecision('2001:db8::/32', '::ffff:192.168.1.9').reason, 'lockout', 'negative: an IPv4 saver against an IPv6-only list');
  assert.equal(P.saveDecision('not-an-address', '192.168.1.9').reason, 'invalid');
  assert.equal(P.saveDecision('192.168.1.0/24', 'unknown').reason, 'lockout', 'negative: an address that cannot be read is no address in the list');
});

test('a caller outside the list reads as a non-administrator, everybody else as they are', () => {
  const c = 'outsideAdmin';
  assert.equal(findOne({ _id: c, isAdmin: true }, c), null, 'the admin check of Authentication.checkUserId says no');
  assert.equal(findOne({ _id: c, isAdmin: { $eq: true } }, c), null);
  assert.equal(findOne({ _id: c, isAdmin: { $in: [true] } }, c), null);
  assert.equal(findOne({ $and: [{ _id: c }, { isAdmin: true }] }, c), null);
  assert.equal(findOne({ _id: c, isAdmin: { $ne: true } })._id, c, 'without a restriction the rewrite is not applied: sanity');
  assert.equal(findOne({ _id: c, isAdmin: { $ne: true } }, c)._id, c, 'a "not an admin" check finds the caller');
  assert.equal(findOne({ _id: c, isAdmin: { $exists: false } }, c), null, 'a flag that exists as false is not missing');
  assert.equal(findOne({ _id: c, isAdmin: { $not: { $eq: true } } }, c)._id, c);
  assert.deepEqual(find({ isAdmin: true }, c), ['otherAdmin'], 'other administrators stay administrators');
  assert.equal(findOne({ _id: 'otherAdmin', isAdmin: true }, c)._id, 'otherAdmin');
  assert.equal(findOne({ _id: 'member', isAdmin: true }, c), null, 'negative: a member is no administrator either way');
  assert.equal(findOne({ _id: c, username: 'outside' }, c)._id, c, 'the caller is still found - their boards work');
  assert.equal(findOne({ 'isAdmin.x': 1, _id: c }, c), null, 'negative: a dotted path never makes the caller an admin');
  assert.equal(findOne({ _id: c, isAdmin: { $gt: false } }, c), null, 'negative: an unknown operator answers no');
});

test('with no known caller (a plain HTTP request before its login) nobody is an administrator', () => {
  assert.deepEqual(find({ isAdmin: true }, null), []);
  assert.deepEqual(find({ isAdmin: { $ne: true } }, null).sort(), ['demoted', 'member', 'otherAdmin', 'outsideAdmin']);
  assert.deepEqual(P.restrictDocument({ _id: 'x', isAdmin: true }, null), { _id: 'x', isAdmin: false });
});

test('the caller\'s own document reads isAdmin false; nobody else\'s changes', () => {
  const admin = { _id: 'outsideAdmin', isAdmin: true, username: 'outside' };
  const read1 = P.restrictDocument(admin, 'outsideAdmin');
  assert.deepEqual(read1, { ...admin, isAdmin: false });
  assert.equal(admin.isAdmin, true, 'a copy: the stored document is never changed');
  const other = { _id: 'otherAdmin', isAdmin: true };
  assert.equal(P.restrictDocument(other, 'outsideAdmin'), other);
  assert.equal(P.restrictDocument(null, 'x'), null);
  assert.equal(P.restrictSelector('outsideAdmin', 'outsideAdmin'), 'outsideAdmin', 'an id selector is left as it is');
  assert.deepEqual(P.restrictSelector({ username: 'x' }, 'c'), { username: 'x' }, 'a selector without isAdmin is left as it is');
});

test('enforced where every admin check reads: the user document, early, for every caller kind', () => {
  const server = read('server/adminPanelAddresses.js');
  assert.match(server, /Meteor\.users\.findOneAsync = async function adminPanelAddressFindOne/);
  assert.match(server, /DDP\._CurrentMethodInvocation/);
  assert.match(server, /DDP\._CurrentPublicationInvocation/);
  assert.match(server, /currentReportRequest\(\)/, 'the REST API and every other HTTP route');
  assert.match(server, /method\.name === 'login'\) return null/, 'signing in reads the stored flag (OIDC and LDAP write it back)');
  const imports = read('server/imports.js');
  const at = imports.indexOf("import '/server/adminPanelAddresses';");
  assert.ok(at > 0, 'loaded');
  assert.ok(at < imports.indexOf("import '/models/"), 'before any model, so before any admin check');
  // Every admin check reaches it: ReactiveCache.getUser, the allow rules, Meteor.userAsync.
  assert.match(read('imports/reactiveCache.js'), /async getUser\(idOrFirstObjectSelector = \{\}, options = \{\}\) \{\n\s+const ret = typeof Users\.findOneAsync === 'function' \? await Users\.findOneAsync/);
  assert.match(read('models/users.js'), /const Users = Meteor\.users;/);
  assert.match(read('server/lib/requestUser.js'), /req\.requestUserId = userId/, 'a cookie or ?authToken= login is known to the request');
});

// The negative test: no admin check reads the flag past Meteor.users.findOneAsync.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'tests', '.npm', '.build'].includes(entry.name) || entry.name.startsWith('_build')) continue;
      walk(rel, out);
    } else if (/\.(js|mjs|cjs)$/.test(entry.name) && !/[._-]tests?\.js$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}
const SERVER_FILES = [...walk('server'), ...walk('models'), ...walk('imports'), ...walk('config'),
  ...fs.readdirSync(path.join(ROOT, 'packages')).filter(p => p.startsWith('wekan-')).flatMap(p => walk(path.join('packages', p)))];

test('negative: no admin check of the caller goes through a cursor or the raw collection', () => {
  const USERS_CURSOR = /\b(?:Users|Meteor\.users|ReactiveCache)\s*\.\s*(?:find|getUsers|rawCollection\(\)\s*\.\s*(?:find|findOne|countDocuments))\s*\(/g;
  // The first argument - the selector - up to its top-level comma or the close.
  const selectorAt = (text, at) => {
    let depth = 0;
    for (let i = at; i < text.length && i < at + 2000; i += 1) {
      const ch = text[i];
      if ('([{'.includes(ch)) depth += 1;
      else if (')]}'.includes(ch)) { if (depth === 0) return text.slice(at, i); depth -= 1; }
      else if (ch === ',' && depth === 0) return text.slice(at, i);
    }
    return text.slice(at, at + 2000);
  };
  const offenders = [];
  for (const file of SERVER_FILES) {
    const text = read(file);
    for (const m of text.matchAll(USERS_CURSOR)) {
      const call = selectorAt(text, m.index + m[0].length);
      if (/isAdmin/.test(call) && /\b(_id|userId|this\.userId|req\.userId)\b/.test(call)) offenders.push(`${file}: ${call.slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, [], 'read the caller with Meteor.users.findOneAsync / ReactiveCache.getUser, which the list restricts');
});

test('negative: no server code reads a user synchronously or through $where/$expr', () => {
  const offenders = [];
  for (const file of SERVER_FILES) {
    const text = read(file);
    for (const m of text.matchAll(/\b(?:Users|Meteor\.users)\.findOne\(/g)) {
      const before = text.slice(Math.max(0, m.index - 200), m.index);
      const line = text.slice(text.lastIndexOf('\n', m.index) + 1, m.index);
      // The client's Minimongo (Meteor.isClient, ReactiveCacheClient), and the
      // fallback that only runs where findOneAsync does not exist.
      const clientOnly = /Meteor\.isClient/.test(before) || /findOneAsync === 'function'/.test(line)
        || (file === path.join('imports', 'reactiveCache.js') && text.lastIndexOf('ReactiveCacheClient = {', m.index) > text.lastIndexOf('ReactiveCacheServer = {', m.index));
      if (!clientOnly) offenders.push(`${file}: findOne`);
    }
    if (/\$(where|expr)[^\n]*isAdmin/.test(text)) offenders.push(`${file}: $where/$expr`);
  }
  assert.deepEqual(offenders, []);
});

test('a refused admin action from outside the list is in Admin Panel / Problems, without disabling the account', () => {
  const { CATALOG } = require('../models/lib/securityCategories.js');
  const entry = CATALOG['authz.admin-panel-address'];
  assert.ok(entry, 'a catalog key');
  assert.equal(entry.blocksAccount, false, 'it is the administrator\'s own account');
  const server = read('server/adminPanelAddresses.js');
  assert.match(server, /try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{\n\s+key: 'authz\.admin-panel-address', action: 'blocked'[\s\S]*?\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.match(server, /recorded\.has\(caller\.mark\)/, 'once per call, not once per check');
  // Only an attempt: an admin check that said no, or an audited admin method.
  assert.match(server, /if \(asStored && asStored\._id === callerId && \(!doc \|\| doc\._id !== callerId\)\) recordRefusal/);
  assert.match(server, /AUDITED\.has\(restriction\.caller\.name\)\) recordRefusal/);
  assert.match(server, /if \(!\(await storedIsAdmin\(caller\.userId\)\)\) return null;/, 'negative: a member\'s ordinary use is never restricted nor logged');
});

test('the list is never published, and only the method that checks the lockout writes it', () => {
  const pub = read('server/publications/settings.js');
  assert.doesNotMatch(pub, /adminPanelAllowedAddresses/);
  const server = read('server/adminPanelAddresses.js');
  assert.match(server, /Settings\.deny\(\{[\s\S]*?fieldNames\.includes\('adminPanelAllowedAddresses'\)/);
  assert.match(server, /async saveAdminPanelAllowedAddresses\(value\) \{\n\s+check\(value, Match\.OneOf\(String, \[String\]\)\);\n\s+await requireSiteAdmin\(this\);\n\s+const yours = addressOfConnection\(this\.connection\);\n\s+const decision = P\.saveDecision\(value, yours\);/);
  assert.match(read('models/settings.js'), /adminPanelAllowedAddresses: \{\n\s+type: Array,/);
  assert.ok(require('../models/lib/adminAudit.js').AUDITED_METHODS.includes('saveAdminPanelAllowedAddresses'), 'in the audit log');
  assert.match(server, /async adminPanelAddressStatus\(\) \{[\s\S]*?refused \? \{ refused: true, yourAddress/, 'tells a refused admin their address, never the list');
});

test('the Admin Panel pane and the refused notice', () => {
  const jade = read('client/components/settings/adminPanelAddresses.jade');
  assert.match(jade, /template\(name="adminPanelAllowedAddresses"\)/);
  assert.match(jade, /'cloud-allowed-addresses-lockout' address=yourAddress/, 'warned before saving');
  assert.match(read('client/components/settings/adminProblems.jade'), /template\(name="featuresSecurity"\)\n\s+ul\.setting-detail\n\s+li\n\s+\+adminPanelAllowedAddresses/);
  assert.match(read('client/components/settings/settingHeader.jade'), /\+adminPanelAddressRefused/);
  const features = read('client/features/settings.js');
  for (const f of ['adminPanelAddresses.jade', 'adminPanelAddresses.js', 'adminPanelAddresses.css']) assert.ok(features.includes(`/client/components/settings/${f}`), f);
});

test('every locale has the strings, in its own words, with __address__ untouched', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8'));
  const KEYS = ['admin-panel-allowed-addresses-desc', 'admin-panel-allowed-addresses-env', 'admin-panel-address-refused'];
  const tokens = s => (String(s).match(/__[A-Za-z0-9_]+?__|%(?:\d+\$)?[sd]/g) || []).sort();
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const code = file.replace('.i18n.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const key of KEYS) {
      assert.equal(typeof data[key], 'string', `${code}: ${key}`);
      assert.deepEqual(tokens(data[key]), tokens(en[key]), `${code}: ${key} keeps its placeholders`);
      if (!/^en([-_]|$)/.test(code)) assert.notEqual(data[key], en[key], `${code}: ${key} is translated`);
    }
    assert.ok(data['admin-panel-allowed-addresses-env'].includes('ADMIN_PANEL_ALLOWED_IP_ADDRESSES'), `${code}: the variable name is not translated`);
  }
});

console.log(`adminPanelAddresses: ${passed} tests passed`);
