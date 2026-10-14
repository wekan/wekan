'use strict';

// #5847: passkey (WebAuthn) login, and Log out everywhere.
// Drives @simplewebauthn/server with a software authenticator (an ES256 key
// made here), so a real signature is verified, and a wrong one is refused.
// Run: node tests/passkeys.test.cjs

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { verifyAuthenticationResponse, generateAuthenticationOptions } = require('@simplewebauthn/server');
const p = require('../models/lib/passkeys.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  // Relying party from ROOT_URL.
  assert.deepEqual(p.relyingParty('https://wekan.example.com/sub'), { rpID: 'wekan.example.com', origin: 'https://wekan.example.com' });
  assert.deepEqual(p.relyingParty('http://localhost:3000'), { rpID: 'localhost', origin: 'http://localhost:3000' });
  assert.equal(p.relyingParty('http://wekan.example.com'), null, 'plain http only on localhost');
  assert.equal(p.relyingParty('nonsense'), null);
  // base64url both ways, any length.
  for (let n = 0; n < 50; n++) {
    const b = crypto.randomBytes(n);
    assert.equal(p.bytesToBase64url(b), b.toString('base64url'));
    assert.deepEqual(Buffer.from(p.base64urlToBytes(b.toString('base64url'))), b);
  }
  assert.throws(() => p.base64urlToBytes('a+b/'), /invalid/);
  assert.equal(p.passkeyName('  My\u0000 phone  '), 'My phone');
  assert.equal(p.passkeyName(''), 'Passkey');
  console.log('  ok - relying party, base64url and names');

  // A software authenticator: sign an assertion as a browser would.
  const rpID = 'wekan.example.com';
  const origin = 'https://wekan.example.com';
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  // COSE EC2 key, CBOR by hand: {1:2, 3:-7, -1:1, -2:x, -3:y}.
  const x = Buffer.from(jwk.x, 'base64url');
  const y = Buffer.from(jwk.y, 'base64url');
  const cose = Buffer.concat([Buffer.from([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20]), x, Buffer.from([0x22, 0x58, 0x20]), y]);
  const credentialId = crypto.randomBytes(16).toString('base64url');
  async function assertion({ counter = 1, signWith = privateKey, originUsed = origin, challenge }) {
    const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin: originUsed, crossOrigin: false }));
    const rpIdHash = crypto.createHash('sha256').update(rpID).digest();
    const authData = Buffer.concat([rpIdHash, Buffer.from([0x05]), Buffer.from([0, 0, 0, counter])]);
    const signature = crypto.sign('sha256', Buffer.concat([authData, crypto.createHash('sha256').update(clientDataJSON).digest()]), signWith);
    return { id: credentialId, rawId: credentialId, type: 'public-key', clientExtensionResults: {},
      response: { clientDataJSON: clientDataJSON.toString('base64url'), authenticatorData: authData.toString('base64url'),
        signature: signature.toString('base64url') } };
  }
  const stored = { id: credentialId, publicKey: p.base64urlToBytes(p.bytesToBase64url(cose)), counter: 0 };
  const verify = async (response, expectedChallenge, credential = stored) => {
    try {
      return (await verifyAuthenticationResponse({ response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID,
        requireUserVerification: false, credential })).verified;
    } catch (e) { return false; }
  };
  const { challenge } = await generateAuthenticationOptions({ rpID });
  assert.equal(await verify(await assertion({ challenge }), challenge), true, 'a real signature from the stored key signs in');
  console.log('  ok - a passkey signature verifies against the stored public key');

  // Negative: another key, another site, another challenge, a replayed counter.
  const other = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
  assert.equal(await verify(await assertion({ challenge, signWith: other }), challenge), false, 'another key');
  assert.equal(await verify(await assertion({ challenge, originUsed: 'https://evil.example' }), challenge), false, 'another origin');
  assert.equal(await verify(await assertion({ challenge }), (await generateAuthenticationOptions({ rpID })).challenge), false, 'another challenge');
  assert.equal(await verify(await assertion({ challenge, counter: 3 }), challenge, { ...stored, counter: 5 }), false, 'a counter that went back (a cloned key)');
  console.log('  ok - wrong key, origin, challenge or a cloned counter are refused');

  // Server wiring.
  const server = read('server/passkeys.js');
  assert.match(server, /Accounts\.registerLoginHandler\('passkey', async options => \{/);
  assert.match(server, /const expectedChallenge = await takeChallenge\(challengeId, 'login'\);/);
  assert.match(server, /async function takeChallenge\([\s\S]{0,300}await PasskeyChallenges\.removeAsync\(\{ _id \}\);\s*\n\s*if \(doc\.expiresAt < new Date\(\)/, 'single use, then expiry');
  assert.match(server, /'passkeys\.\$\.counter': verification\.authenticationInfo\.newCounter/, 'the counter moves on');
  assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'\);\s*\n\s*const expectedChallenge = await takeChallenge\(challengeId, 'register', this\.userId\);/, 'register binds the challenge to the account');
  assert.match(server, /\$pull: \{ passkeys: \{ id \} \}/);
  assert.match(server, /ensureIndex\(PasskeyChallenges, \{ expiresAt: 1 \}, \{ expireAfterSeconds: 0 \}\)/);
  assert.match(read('server/imports.js'), /import '\/server\/passkeys';/);
  for (const f of ['server/publications/users.js', 'server/publications/boards.js']) assert.doesNotMatch(read(f), /passkeys/, `${f} never publishes passkeys`);
  assert.doesNotMatch(read('models/users.js'), /USER_UPDATE_ALLOWED_EXACT = \[[^\]]*'passkeys'/);
  assert.equal(JSON.parse(read('package.json')).dependencies['@simplewebauthn/server'], '14.0.3', 'pinned');
  // Log out everywhere: every token of the caller only.
  assert.match(read('server/models/users.js'), /async logoutEverywhere\(\) \{\s*if \(!this\.userId\) throw[\s\S]{0,100}Users\.updateAsync\(this\.userId, \{ \$set: \{ 'services\.resume\.loginTokens': \[\] \} \}\);/);
  // UI.
  assert.match(read('client/components/main/layouts.jade'), /if passkeysSupported\s*\n\s*button\.primary\.js-passkey-sign-in/);
  assert.match(read('client/components/users/userHeader.jade'), /a\.js-logout-everywhere/);
  assert.match(read('client/components/users/userHeader.js'), /'click \.js-logout-everywhere': Popup\.afterConfirm\('logoutEverywhere'/);
  console.log('  ok - single-use challenges, counters, unpublished keys, log out everywhere');
  console.log('\npasskeys: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
