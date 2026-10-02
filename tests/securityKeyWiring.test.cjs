'use strict';

// Guard (2026-10-02): every key in the Admin Panel -> Problems catalog
// (models/lib/securityCategories.js) is recorded somewhere - by a record()
// call or through a canary - or is listed below with the reason nothing can
// record it. Nine keys had no caller at all, so the Hall of Fame names they
// stand for could never appear in Problems however often they were tried.
// Run: node tests/securityKeyWiring.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const UNWIRED = {
  'authz.share': 'RevokeBleed: opening a board whose share was revoked is ordinary use; the publication simply stops serving it.',
  'file.disk': 'the disk-space category: disk exhaustion is a resource state, not an attributable attempt.',
  'file.policy': 'the file-policy category: informational category for file-policy changes; nothing is refused.',
  'auth-race.cas': 'CasBleed: the race was removed by storing each validation under its own token; '
    + 'two concurrent logins are ordinary and leave nothing to refuse (CasTokenBleed has its own key).',
};

const NEWLY_WIRED = {
  'ssrf.fetch': ['server/lib/ssrfGuard.js', /key: 'ssrf\.fetch', action: 'blocked', source: 'fetchSafe:dns'/],
  'ssrf.webhook': ['server/notifications/outgoing.js', /key: 'ssrf\.webhook', action: 'blocked', source: 'outgoingWebhooks'/],
  'xss.source': ['models/trelloCreator.js', /key: 'xss\.source', action: 'detected', source: 'import:trello-source-url'/],
  'auth-race.oidc': ['server/models/org.js', /key: 'auth-race\.oidc', action: 'blocked'/],
  'brute.invite': ['server/models/users.js', /key: 'brute\.invite', action: 'detected', source: 'register:invitation-code'/],
  'authz.readonly': ['models/lib/canaryTokens.js', /'board\.readonly-write': \{\n\s*key: 'authz\.readonly',/],
  'authn.cas-state': ['models/lib/canaryTokens.js', /'cas\.state-mismatch': \{\n\s*key: 'authn\.cas-state',/],
  'authz.notification-tray': ['server/permissions/users.js', /key: 'authz\.notification-tray', action: 'blocked'/],
};

function sources() {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (['node_modules', 'tests'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(e.name) ? [rel] : []);
  });
  return ['server', 'models', 'packages', 'imports', 'client', 'config'].flatMap(walk)
    .filter(f => f !== 'models/lib/securityCategories.js');
}

test('the keys that had no caller are recorded where their attack is refused', () => {
  for (const [key, [file, pattern]] of Object.entries(NEWLY_WIRED)) assert.match(read(file), pattern, key);
  // Both OIDC-only methods of org.js and team.js record it.
  for (const file of ['server/models/org.js', 'server/models/team.js']) {
    assert.equal((read(file).match(/key: 'auth-race\.oidc'/g) || []).length, 2, file);
  }
});

test('negative: no catalog key is orphaned without a stated reason', () => {
  const catalog = read('models/lib/securityCategories.js');
  const keys = [...catalog.matchAll(/^ {2}'([a-z0-9.-]+)':\s*\{/gm)].map(m => m[1]);
  assert.ok(keys.length > 50);
  const all = sources().map(read).join('\n');
  const orphans = keys.filter(k => !all.includes(`'${k}'`) && !all.includes(`"${k}"`) && !all.includes(`\`${k}`));
  assert.deepEqual(orphans.sort(), Object.keys(UNWIRED).sort());
});
