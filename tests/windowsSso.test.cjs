'use strict';

// #5758: Windows single sign-on (Kerberos / NTLM through node-expose-sspi).
// The decisions run here in plain Node; the handshake itself needs Windows,
// a domain and node-expose-sspi, which this test environment does not have,
// so the server wiring is pinned by reading its source.
// Run: node tests/windowsSso.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  parseWindowsName, allowedDomains, isDomainAllowed, windowsProfile, resolveMember, moduleSearchBases, windowsSsoEnabled,
} = require('../models/lib/windowsSso.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  // Who the handshake proved.
  assert.deepEqual(parseWindowsName('CONTOSO\\Alice'), { domain: 'contoso', user: 'alice' });
  assert.deepEqual(parseWindowsName('alice@CONTOSO.EXAMPLE.COM'), { domain: 'contoso', user: 'alice' });
  assert.deepEqual(parseWindowsName(' CONTOSO\\a.b-c_d '), { domain: 'contoso', user: 'a.b-c_d' });
  // Negative: nothing that is not one account in one domain.
  for (const bad of ['', 'alice', '\\alice', 'CONTOSO\\', 'A\\B\\c', 'alice@', '@CONTOSO', 'a@b@c', 'CONTOSO\\WS01$',
    'CONTOSO\\al ice', 'CONTOSO\\../admin', 'CON TOSO\\alice', 'CONTOSO\\alice@x', null, undefined, 42, ['CONTOSO\\alice']]) {
    assert.equal(parseWindowsName(bad), null, JSON.stringify(bad));
  }
  console.log('  ok - DOMAIN\\user and user@REALM, nothing else, no machine accounts');

  assert.deepEqual(allowedDomains('CONTOSO, fabrikam.example.com,,  '), ['contoso', 'fabrikam']);
  assert.equal(isDomainAllowed(parseWindowsName('CONTOSO\\alice'), allowedDomains('contoso')), true);
  assert.equal(isDomainAllowed(parseWindowsName('alice@FABRIKAM.EXAMPLE.COM'), allowedDomains('fabrikam.example.com')), true);
  // Negative: an empty list lets nobody in; another domain is refused.
  assert.equal(isDomainAllowed(parseWindowsName('CONTOSO\\alice'), allowedDomains('')), false);
  assert.equal(isDomainAllowed(parseWindowsName('CONTOSO\\alice'), allowedDomains(undefined)), false);
  assert.equal(isDomainAllowed(parseWindowsName('EVIL\\alice'), allowedDomains('contoso')), false);
  assert.equal(isDomainAllowed(null, allowedDomains('contoso')), false);
  console.log('  ok - only WINDOWS_SSO_DOMAINS; empty means nobody');

  const alice = parseWindowsName('CONTOSO\\alice');
  assert.deepEqual(windowsProfile(alice, { mail: ['Alice@Contoso.example'], displayName: ['Alice Example'] }),
    { id: 'contoso\\alice', username: 'alice', fullname: 'Alice Example', email: 'alice@contoso.example' });
  assert.deepEqual(windowsProfile(alice, { givenName: ['Alice'], sn: ['Example'] }).fullname, 'Alice Example');
  assert.deepEqual(windowsProfile(alice, undefined), { id: 'contoso\\alice', username: 'alice', fullname: 'alice', email: '' });
  assert.equal(windowsProfile(alice, { mail: ['not an address'] }).email, '', 'a malformed mail is not used');
  console.log('  ok - the profile from the handshake and Active Directory');

  // Which member: the linked one first; by name or e-mail only on request.
  const users = [
    { _id: 'linked', username: 'someone', services: { windowsSso: { id: 'contoso\\alice' } } },
    { _id: 'local-alice', username: 'alice' },
    { _id: 'mail-bob', username: 'robert', emails: [{ address: 'bob@contoso.example' }] },
  ];
  const find = async selector => users.find(u => Object.entries(selector).every(([k, v]) =>
    k === 'username' ? u.username === v
      : k === 'services.windowsSso.id' ? u.services?.windowsSso?.id === v
        : k === 'emails.address' ? (u.emails || []).some(e => e.address === v) : false)) || null;
  const profile = windowsProfile(alice, { mail: ['alice@contoso.example'] });
  assert.deepEqual(await resolveMember(profile, { find }), { userId: 'linked' });
  assert.deepEqual(await resolveMember(profile, { find, merge: true }), { userId: 'linked' }, 'the link wins over a name');
  const unlinked = { ...profile, id: 'contoso\\alice2' };
  // Negative: without merge a local "alice" is NOT taken over - a new account is made beside it.
  assert.deepEqual(await resolveMember(unlinked, { find }), { create: 'alice-2' });
  assert.deepEqual(await resolveMember(unlinked, { find, merge: true }), { userId: 'local-alice', link: true });
  const bob = windowsProfile(parseWindowsName('CONTOSO\\bob'), { mail: ['bob@contoso.example'] });
  assert.deepEqual(await resolveMember(bob, { find }), { create: 'bob' });
  assert.deepEqual(await resolveMember(bob, { find, merge: true }), { userId: 'mail-bob', link: true });
  const crowded = async selector => (selector.username ? { _id: 'taken' } : null);
  assert.deepEqual(await resolveMember(bob, { find: crowded }), { refused: 'windows-sso-username-taken' });
  console.log('  ok - the linked member, merge only on request, a free username otherwise');

  // Only on Windows, only when asked.
  assert.equal(windowsSsoEnabled({ platform: 'win32', env: { WINDOWS_SSO_ENABLED: 'true' } }), true);
  for (const [platform, value] of [['linux', 'true'], ['darwin', 'true'], ['win32', ''], ['win32', 'false'], ['win32', 'TRUE '], ['win32', undefined]]) {
    assert.equal(windowsSsoEnabled({ platform, env: { WINDOWS_SSO_ENABLED: value } }), false, `${platform} ${value}`);
  }
  assert.deepEqual(moduleSearchBases({ cwd: 'C:\\wekan\\bundle', mainScript: 'C:\\wekan\\bundle\\main.js' }),
    ['C:/wekan/bundle/programs/server', 'C:/wekan/bundle']);
  console.log('  ok - Windows only, opt-in, node-expose-sspi from the bundle');

  // The server: a one-time token, used once, through the ordinary login checks.
  const server = read('server/windowsSso.js');
  assert.match(server, /if \(!enabled\(\) \|\| !loadSspi\(\) \|\| Meteor\.settings\?\.public\?\.sandstorm\) \{\s*res\.writeHead\(404\)/);
  assert.match(server, /isDomainAllowed\(parsed, allowedDomains\(authEnv\('WINDOWS_SSO_DOMAINS'\)\)\)/);
  assert.match(server, /merge: authEnv\('WINDOWS_SSO_MERGE_EXISTING_USERS'\) === 'true'/);
  assert.match(server, /WindowsSsoTokens\.insertAsync\(\{ _id: hash\(token\), userId: member\.userId, expiresAt: new Date\(Date\.now\(\) \+ TOKEN_MS\) \}\)/);
  assert.match(server, /findOneAndDelete\(\{ _id: hash\(options\.windowsSso\) \}\)/, 'single use');
  assert.match(server, /if \(!doc \|\| doc\.expiresAt <= new Date\(\)\) return invalid;/);
  assert.match(server, /Accounts\.registerLoginHandler\('windowsSso'/, 'a login handler, so every validateLoginAttempt rule applies');
  assert.match(server, /ensureIndex\(WindowsSsoTokens, \{ expiresAt: 1 \}, \{ expireAfterSeconds: 0 \}\)/);
  // Negative: never minted outside the login handler, never stored in clear,
  // never a dependency every platform installs.
  assert.doesNotMatch(server, /_generateStampedLoginToken|insertActiveLoginToken|Set-Cookie/);
  assert.doesNotMatch(server, /insertAsync\(\{ _id: token/);
  assert.doesNotMatch(read('package.json'), /node-expose-sspi/);
  assert.match(read('server/imports.js'), /^import '\/server\/windowsSso';$/m);
  console.log('  ok - the server: one-time hashed token, single use, ordinary login checks');

  // The sign-in page.
  assert.match(read('client/components/main/layouts.jade'), /if windowsSsoOffered\s*\n\s*a\.button\.primary\.js-windows-sso\(href="\/sso\/windows"\)/);
  const layouts = read('client/components/main/layouts.js');
  assert.match(layouts, /FlowRouter\.getQueryParam\('windowsSso'\)/);
  assert.match(layouts, /methodArguments: \[\{ windowsSso: String\(windowsSsoToken\) \}\]/);
  assert.match(layouts, /windowsSsoOffered\(\) \{ return Meteor\.settings\?\.public\?\.windowsSsoEnabled === true; \}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['windows-sso-sign-in', 'windows-sso-failed']) assert.equal(typeof en[key], 'string', key);
  assert.match(read('docs/Features/Login-Page/WindowsSSO.md'), /WINDOWS_SSO_DOMAINS/);
  console.log('  ok - the sign-in page and the docs');

  console.log('\nwindowsSso: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
