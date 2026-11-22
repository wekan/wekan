'use strict';
// BounceBleed (GHSA-7w85-38ph-c96v, GHSA-2wcc-f289-3r95, GHSA-735h-p955-fwxp):
// one forged delivery report through POST /api/inbound-email, which needs no
// secret by default, was recorded as a hard bounce and stopped every email
// WeKan sends to the address it named - invitations, notifications, password
// resets - with no way for that person to undo it.
//
// A bounce is recorded now only when the transport vouches for who sent it.
// The test: the decision passes `trusted` through, and from the webhook only
// when its secret was configured (and so checked). The negative test: every
// place that hands an email in says whether it may carry a bounce, nothing else
// calls handleBounceEmail, and nothing records a bounce without that gate - so
// the same hole cannot be open in another receiver. The route itself, over
// HTTP: server/lib/tests/inboundEmailRoute.tests.js.
// Run: node tests/bounceBleed.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const SKIP = new Set(['node_modules', '.build', '.tools', '.meteor', 'tests', 'packages']);
function files(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('_build')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}
const sources = [...files(path.join(root, 'server')), ...files(path.join(root, 'models'))]
  .map(f => ({ rel: path.relative(root, f), text: fs.readFileSync(f, 'utf8') }));

// The test: the gate.
const bounces = read('server/emailBounces.js');
assert.match(bounces, /export async function handleBounceEmail\(message, \{ source = 'email', trusted = false \} = \{\}\)/,
  'untrusted unless told otherwise');
assert.match(bounces, /if \(trusted !== true\) \{[\s\S]{0,400}key: 'authn\.inbound-bounce', action: 'blocked'[\s\S]{0,400}return 'refused';\s*\}\s*await recordBounces/,
  'refused, and logged, before anything is recorded');
const route = read('server/routes/inboundEmail.js');
assert.match(route, /bounceAllowed: Boolean\(expected\)/, 'the webhook vouches only when its secret is configured');
assert.match(route, /if \(expected\) \{[\s\S]{0,300}secretMatches\(given, expected\)/, '...and then checked');
assert.match(route, /if \(bounce === 'refused'\) return \{ handled: true, code: 403/, 'a refused bounce is not a card or a comment');

// The negative test: every receiver says, and only the trusted ones say yes.
const TRUSTED = { 'server/emailBounces.js': 'ses', 'server/sandstormEmail.js': 'sandstorm-grain-email', 'server/lib/imapInbound.js': 'imap' };
const calls = [];
for (const { rel, text } of sources) {
  for (const m of text.matchAll(/(?<!function )\breceiveEmail\(/g)) {
    const line = text.slice(text.lastIndexOf('\n', m.index) + 1, m.index);
    if (/^\s*(\/\/|\*)/.test(line)) continue; // a comment naming it
    // The call's arguments: up to the end of its statement.
    const args = text.slice(m.index, text.indexOf(';', m.index));
    calls.push(rel);
    assert.match(args, /bounceAllowed:/, `${rel}: receiveEmail() without saying whether it may carry a bounce`);
    if (/bounceAllowed: true/.test(args)) {
      assert.ok(TRUSTED[rel], `${rel}: vouches for bounces, but is not one of the trusted transports`);
    }
  }
  if (rel !== 'server/routes/inboundEmail.js' && rel !== 'server/emailBounces.js') {
    assert.ok(!/\bhandleBounceEmail\(/.test(text), `${rel}: calls handleBounceEmail around receiveEmail's gate`);
  }
}
for (const rel of Object.keys(TRUSTED)) assert.ok(calls.includes(rel), `${rel} hands mail in`);
assert.ok(calls.includes('server/routes/inboundEmail.js'), 'the webhook hands mail in');
// recordBounces is reached only from a verified SES notification, a signed
// provider webhook, or handleBounceEmail's trusted branch.
const records = [...bounces.matchAll(/await recordBounces\(/g)].length;
assert.equal(records, 3, 'recordBounces: SES bounce/complaint, the provider webhooks, and the trusted inbound branch');
for (const { rel, text } of sources) {
  if (rel === 'server/emailBounces.js') continue;
  assert.ok(!/\brecordBounces\(/.test(text), `${rel}: records bounces outside server/emailBounces.js`);
}

// Admin Panel -> Problems groups the refusals under the Hall of Fame name.
assert.match(read('models/lib/securityCategories.js'), /'authn\.inbound-bounce': \{ category: 'authn', bleed: 'BounceBleed'/);
console.log(`bounceBleed: ${calls.length} receivers, each says whether it may carry a bounce; only the trusted ones do`);
