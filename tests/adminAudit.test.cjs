'use strict';

// Admin Panel / People / Audit log (models/lib/adminAudit.js,
// server/adminAudit.js, client/components/settings/adminAuditLog.*).
//
//  - test: an administrator's call of an audited method is recorded with who,
//    what, the outcome and where from - a refused call too;
//  - negative: no password or secret reaches the trail, by key, by position or
//    inside a URL; a member who is not a site administrator is not recorded;
//    a failure to record never changes what the method did; the 2FA wrapper
//    and this one never wrap each other twice;
//  - every audited name is a real method, and the trail is admin-only.
//
// Run: node tests/adminAudit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const audit = require('../models/lib/adminAudit');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => { await fn(); passed += 1; console.log('  ok -', name); });
}

test('no password or secret reaches the trail', () => {
  const pw = 'Hunter2-correct-horse';
  const stored = [
    audit.auditArgs('setPassword', [pw, 'userId1']),
    audit.auditArgs('setCreateUser', ['Full', 'alice', 'A', pw, 'false', 'false', 'a@example.com', [], [], []]),
    audit.auditArgs('saveAuthConfigSettings', ['ldap', { host: 'ldap.example', bindPassword: pw }]),
    audit.auditArgs('saveOauthProviderSettings', ['google', { clientId: 'c', secret: pw }]),
    audit.auditArgs('updateAttachmentStorageSettings', [{ s3: { accessKeyId: pw, secretAccessKey: pw }, azure: { accountKey: pw, connectionString: pw } }]),
    audit.auditArgs('saveAdminMailSettings', [{ mailUrl: `smtps://user:${pw}@mail.example:465` }]),
    audit.auditArgs('saveAccountWebhook', [{ url: 'https://hook.example', token: pw }]),
  ];
  for (const text of stored) assert.ok(!text.includes(pw), text);
  assert.match(stored[0], /^\["\[redacted\]","userId1"\]$/);
  assert.match(stored[1], /"alice"/, 'what is not secret stays readable');
  assert.match(stored[5], /smtps:\/\/user:\[redacted\]@mail\.example/);
});

test('long and deep arguments are cut short', () => {
  assert.ok(audit.auditArgs('uploadSiteLogo', ['logo', 'A'.repeat(100000)]).length < 2100);
  const deep = { a: { b: { c: { d: { e: 'x' } } } } };
  assert.match(audit.auditArgs('saveInstanceFeatures', [deep]), /\[…\]/);
});

// server/adminAudit.js with an in-memory trail.
function loadServer(storedUsers, { failInsert = false } = {}) {
  const handlers = {};
  const trail = [];
  const Meteor = {
    Error: class extends Error { constructor(e) { super(e); this.error = e; } },
    methods(defs) { Object.assign(handlers, defs); },
    startup() {}, defer() {}, setInterval() {},
    server: { method_handlers: handlers },
    users: { findOneAsync: async id => storedUsers[id] || null },
  };
  const context = {
    Meteor, Symbol, Object, Date, console: { error() {} }, process: { env: {} },
    Mongo: { Collection: function Collection() {
      return { insertAsync: async doc => { if (failInsert) throw new Error('db down'); trail.push(doc); } };
    } },
    check() {}, Match: { ObjectIncluding: () => null, Optional: () => null, Integer: null },
    ensureIndex: async () => {},
    // server/lib/argumentChecks.js; the audit itself is tests/wrappedHandlerArgumentChecks.test.cjs.
    deferArgumentAudit() {}, applyAudited: (handler, self, args) => handler.apply(self, args),
    require: p => {
      if (p === '/models/lib/adminAudit') return audit;
      if (p === '/server/lib/loginAttemptThrottle') return { resolveClientKey: ({ socketAddress }) => socketAddress };
      return require(p);
    },
    module: { exports: {} },
  };
  handlers.setPassword = async function setPassword(pw, userId) { return `set ${userId}`; };
  handlers.removeUser = async function removeUser() { throw new Meteor.Error('not-authorized'); };
  handlers.updateCard = async function updateCard() { return 'card'; };
  const src = read('server/adminAudit.js')
    .replace(/^import .*;\n/gm, '')
    .replace(/^export const AdminAuditLog/m, 'const AdminAuditLog')
    .replace(/^export function wrapAuditedMethods/m, 'function wrapAuditedMethods')
    + '\nmodule.exports = { wrapAuditedMethods };\n';
  vm.runInNewContext(src, context);
  context.module.exports.wrapAuditedMethods();
  return { handlers, trail, wrap: context.module.exports.wrapAuditedMethods };
}
const users = {
  admin: { _id: 'admin', username: 'root', isAdmin: true },
  member: { _id: 'member', username: 'bob', isAdmin: false },
};
const inv = userId => ({ userId, connection: { clientAddress: '192.0.2.7', httpHeaders: {} } });

test('an administrator\'s action is recorded with who, what, outcome and address', async () => {
  const s = loadServer(users);
  assert.strictEqual(await s.handlers.setPassword.call(inv('admin'), 'Secret-123456', 'u2'), 'set u2');
  await assert.rejects(() => s.handlers.removeUser.call(inv('admin'), 'u3'));
  assert.strictEqual(s.trail.length, 2);
  const [set, removed] = s.trail;
  assert.deepStrictEqual([set.actorUsername, set.method, set.ok, set.ip], ['root', 'setPassword', true, '192.0.2.7']);
  assert.ok(!set.args.includes('Secret-123456'));
  assert.deepStrictEqual([removed.method, removed.ok, removed.error], ['removeUser', false, 'not-authorized']);
  await s.handlers.updateCard.call(inv('admin'));
  assert.strictEqual(s.trail.length, 2, 'editing a card is not an administrative action');
});

test('negative: a member who is not a site administrator is not in the trail', async () => {
  const s = loadServer(users);
  await s.handlers.setPassword.call(inv('member'), 'x', 'u2');
  assert.strictEqual(s.trail.length, 0);
});

test('negative: a trail that cannot be written never changes the answer', async () => {
  const s = loadServer(users, { failInsert: true });
  assert.strictEqual(await s.handlers.setPassword.call(inv('admin'), 'x', 'u9'), 'set u9');
});

test('negative: wrapping again, also over the 2FA wrapper, records once', async () => {
  const s = loadServer(users);
  const audited = s.handlers.setPassword;
  // The 2FA wrapper copies the marks of what it wraps (server/requireTwoFactor.js).
  const outer = async function twoFactor(...args) { return audited.apply(this, args); };
  for (const mark of Object.getOwnPropertySymbols(audited)) outer[mark] = audited[mark];
  s.handlers.setPassword = outer;
  s.wrap();
  assert.strictEqual(s.handlers.setPassword, outer);
  await s.handlers.setPassword.call(inv('admin'), 'x', 'u2');
  assert.strictEqual(s.trail.length, 1);
  assert.match(read('server/requireTwoFactor.js'), /Object\.getOwnPropertySymbols\(original\)/);
});

test('every audited name is a Meteor method that exists', () => {
  const files = execFileSync('git', ['ls-files', 'server', 'models', 'packages'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n').filter(f => f.endsWith('.js') && !/test/i.test(f));
  const source = files.map(f => read(f)).join('\n');
  const missing = audit.AUDITED_METHODS.filter(name =>
    !new RegExp(`^\\s+(async\\s+)?['"]?${name}['"]?\\s*(\\(|:\\s*(async\\s+)?function)`, 'm').test(source));
  assert.deepStrictEqual(missing, []);
  for (const [name, positions] of Object.entries(audit.SECRET_POSITIONS)) {
    assert.ok(audit.AUDITED_METHODS.includes(name), name);
    assert.ok(positions.every(Number.isInteger));
  }
});

test('the trail is for site administrators, and the Admin Panel shows it', () => {
  const server = read('server/adminAudit.js');
  assert.match(server, /user\.isAdmin !== true \|\| user\.loginDisabled === true\) throw new Meteor\.Error\('error-notAuthorized'\)/);
  assert.match(server, /AUDIT_KEEP_DAYS \* DAY_MS/, 'kept for a year, then removed');
  assert.match(read('server/imports.js'), /import '\/server\/adminAudit';/);
  assert.match(read('client/components/settings/adminAuditLog.js'), /Meteor\.call\('adminAuditLogPage'/);
  assert.match(read('client/components/settings/peopleBody.js'), /id: 'audit-log-setting'/);
  assert.match(read('client/components/settings/peopleBody.jade'), /\+adminAuditLog/);
});

(async () => {
  for (const run of pending) await run();
  console.log(`adminAudit: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
