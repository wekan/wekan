'use strict';

// Source-guard regression tests for the 8 security issues reported by meifukun
// against WeKan v9.95.0 (see ../log/v10/sec/). These assert, from source, that
// each fix is present and each vulnerable pattern is gone. They run under plain
// node (no Meteor/DB), matching the other tests/*.test.cjs guards.
//
// Each section names the Hall of Fame vulnerability it guards - RedirectBleed,
// SourceBleed, LiveBleed, CasBleed, OidcBleed, MetricsBleed, ImpersonateBleed,
// InviteBleed - because a regression test that does not say WHICH published
// vulnerability it belongs to cannot be checked against the published list. See
// tests/securityRegressionCoverage.test.cjs, which does that checking.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ── #1 Avatar localization redirect SSRF — RedirectBleed ────────────────────
check('#1 avatar localization fetches via fetchSafe, not native redirect-follow', () => {
  const src = read('server/lib/localizeAvatar.js');
  assert.ok(/fetchSafe\(url,/.test(src), 'localizeAvatar must fetch via fetchSafe');
  assert.ok(
    !/fetch\(url,\s*\{\s*redirect:\s*'follow'/.test(src),
    'the native redirect:follow fetch must be gone',
  );
});
check('#1 setAvatarUrl validates the URL scheme at write time', () => {
  const src = read('server/models/users.js');
  assert.ok(/function assertSafeAvatarUrl/.test(src), 'assertSafeAvatarUrl helper must exist');
  // both setters must call it
  const setter = src.slice(src.indexOf('async setAvatarUrl('));
  assert.ok(/assertSafeAvatarUrl\(avatarUrl\)/.test(setter), 'setAvatarUrl must validate');
  const adminSetter = src.slice(src.indexOf('async adminSetAvatarUrl('));
  assert.ok(/assertSafeAvatarUrl\(avatarUrl\)/.test(adminSetter), 'adminSetAvatarUrl must validate');
  // the validator must reject a javascript: scheme (only http/https/data:image/local allowed)
  assert.ok(/scheme === 'http' \|\| scheme === 'https'/.test(src));
});

// ── #2 Trello import source URL stored XSS — SourceBleed ────────────────────
check('#2 activity sourceLink only links http(s) URLs', () => {
  const src = read('client/components/activities/activities.js');
  const fn = src.slice(src.indexOf('sourceLink()'), src.indexOf('memberLink()'));
  assert.ok(/https\?:\\\/\\\//.test(fn) || /\^https\?:/.test(fn),
    'sourceLink must scheme-check source.url before building the href');
});
check('#2 Trello import stores only http(s) source.url', () => {
  const src = read('models/trelloCreator.js');
  assert.ok(
    /\/\^https\?:\\\/\\\/\/i\.test\(String\(trelloBoard\.url/.test(src),
    'trelloCreator must scheme-check trelloBoard.url before storing it',
  );
});

// ── #3 Trello live import readable-response SSRF — LiveBleed ────────────────
check('#3 live Trello import guards every download with validateAttachmentUrl', () => {
  const src = read('server/trelloApiImport.js');
  assert.ok(/import \{ validateAttachmentUrl \}/.test(src), 'must import validateAttachmentUrl');
  // at least three guarded sinks: attachments, background, avatars
  const guards = (src.match(/validateAttachmentUrl\(/g) || []).length;
  assert.ok(guards >= 3, `expected >=3 validateAttachmentUrl guards, found ${guards}`);
});
// Validating the URL is only half of it: the DOWNLOAD must be guarded too, or
// the target answers with a redirect to 127.0.0.1 and the guard never sees it
// (FollowBleed, GHSA-j9p2-jm73-p549 — the bypass of this fix). tests/followbleed
// .test.cjs proves the redirect behaviour; this keeps the sinks honest here too.
check('#3 …and downloads through fetchSafe, never a bare redirect-following fetch', () => {
  const src = read('server/trelloApiImport.js');
  assert.ok(/import \{ fetchSafe \}/.test(src), 'must import fetchSafe');
  assert.strictEqual(
    (src.match(/await fetch\(/g) || []).length,
    1,
    'only the hardcoded api.trello.com request may use the platform fetch',
  );
});

// ── #4 CAS login global user-data race — CasBleed ───────────────────────────
check('#4 CAS stores user data per token, not in a module global', () => {
  const src = read('packages/wekan-accounts-cas/cas_server.js');
  assert.ok(!/^\s*let _userData\b/m.test(src), 'the module-global _userData must be gone');
  assert.ok(!/\b_userData\s*=\s*userData\b/.test(src), 'the global _userData assignment must be gone');
  assert.ok(/_casCredentialTokens\[token\]\s*=\s*\{\s*id:\s*userData\.id,\s*userData/.test(src),
    'userData must be stored per credential token');
  assert.ok(/const userData = \(result && result\.userData\)/.test(src),
    'login handler must read the per-token userData');
});

// ── #5 OIDC shared serviceData race — OidcBleed (fixed upstream, #4897) ─────
check('#5 OIDC per-login objects are declared inside the callback', () => {
  const src = read('packages/wekan-oidc/oidc_server.js');
  const cbStart = src.indexOf("OAuth.registerService('oidc'");
  assert.ok(cbStart >= 0, 'oidc registerService callback must exist');
  // the three per-login objects must be declared INSIDE the callback (after its
  // start), not at module scope.
  for (const decl of ['var profile = {};', 'var serviceData = {};', 'var userinfo = {};']) {
    const at = src.indexOf(decl);
    assert.ok(at > cbStart, `${decl} must be a local inside the oidc callback`);
  }
});

// ── #6 Metrics X-Forwarded-For whitelist bypass — MetricsBleed ──────────────
check('#6 metrics endpoint does not trust X-Forwarded-For unconditionally', () => {
  const src = read('models/server/metrics.js');
  assert.ok(/function metricsClientIp/.test(src), 'metricsClientIp helper must exist');
  assert.ok(/METRICS_TRUST_PROXY/.test(src), 'must gate XFF behind METRICS_TRUST_PROXY');
  // the vulnerable unconditional XFF read must be gone from the handler
  assert.ok(
    !/const ipAddress =\s*req\.headers\['x-forwarded-for'\] \|\| req\.socket\.remoteAddress;/.test(src),
    'the unconditional XFF ipAddress must be gone',
  );
  assert.ok(/const ipAddress = metricsClientIp\(req\)/.test(src));
});

// ── #7 Stale impersonation allows private board export — ImpersonateBleed ───
check('#7 export authorization no longer bypasses via stale impersonation', () => {
  for (const f of ['models/export.js', 'models/exportExcel.js', 'models/exportExcelCard.js', 'models/exportPDF.js']) {
    const src = read(f);
    assert.ok(!/\|\| impersonateDone\)\s*\{/.test(src),
      `${f} must not authorize export with "|| impersonateDone)"`);
  }
});

// ── #8 Invitation code brute force — InviteBleed ────────────────────────────
check('#8 invitation codes are CSPRNG, not 6-digit Math.random', () => {
  const src = read('server/models/settings.js');
  assert.ok(!/getRandomNum\(100000, 999999\)/.test(src), 'the 6-digit Math.random code must be gone');
  assert.ok(/crypto\.randomBytes\(16\)\.toString\('base64url'\)/.test(src),
    'invitation code must be a 128-bit CSPRNG value');
});
check('#8 account creation is rate-limited (defence in depth)', () => {
  const src = read('server/models/users.js');
  assert.ok(/DDPRateLimiter\.addRule/.test(src), 'a DDPRateLimiter rule must exist');
  assert.ok(/name:\s*'createUser'/.test(src), 'the rule must target createUser');
});

console.log(`\nsecurityMeifukun: ${passed} checks passed`);
