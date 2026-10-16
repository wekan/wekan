'use strict';
// #6549: WeKan -> Rocket.Chat (OAuth2) -> G Suite (SAML) only completes when
// every hop returns to the page that started it. The documented answer is the
// redirect login style, so the default must stay redirect and the doc must say
// how to configure the chain.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const auth = read('server/authentication.js');
assert.match(auth, /loginStyle:\s*authEnv\('OAUTH2_LOGIN_STYLE'\) === 'popup' \? 'popup' : 'redirect'/,
  'OIDC login style defaults to redirect; popup only when asked');
assert.match(read('snap-src/bin/config'), /DEFAULT_OAUTH2_LOGIN_STYLE="redirect"/, 'snap default is redirect');

const doc = read('docs/Features/Login-Page/OAuth2.md');
const start = doc.indexOf('### Rocket.Chat signing in with SAML');
assert.ok(start > 0, 'the SAML chain section exists');
const section = doc.slice(start, doc.indexOf('\n## ', start) > 0 ? doc.indexOf('\n## ', start) : undefined);
assert.match(section, /issues\/6549/);
assert.match(section, /oauth2-login-style='redirect'/);
assert.match(section, /OAUTH2_LOGIN_STYLE=redirect/);
assert.match(section, /_oauth\/oidc/, 'names the exact redirect URI');
assert.match(section, /NameID/, 'says what Google must send');

// Negative: the section never recommends the popup style for this chain.
assert.doesNotMatch(section, /login-style='popup'|OAUTH2_LOGIN_STYLE=popup/);
console.log('oauth2RocketChatSamlChainDocs: all tests passed');
