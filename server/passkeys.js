// #5847: passkey (WebAuthn) login - Member Settings adds and removes a
// member's passkeys, and the sign-in page signs in with one
// (models/lib/passkeys.js). Verification is @simplewebauthn/server's, against
// ROOT_URL's host and origin, with a single-use challenge that lives five
// minutes. A member's passkeys are a top-level user field, never published:
// the public keys are not secret, but which devices somebody uses is theirs.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Random } from 'meteor/random';
import { ensureIndex } from '/server/lib/mongoStartup';

const {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { relyingParty, base64urlToBytes, bytesToBase64url, passkeyName, MAX_PASSKEYS } = require('/models/lib/passkeys');

const CHALLENGE_MS = 5 * 60 * 1000;
export const PasskeyChallenges = new Mongo.Collection('passkeyChallenges');
PasskeyChallenges.deny({ insert: () => true, update: () => true, remove: () => true });

function rp() {
  const party = relyingParty(process.env.ROOT_URL || Meteor.absoluteUrl());
  if (!party) throw new Meteor.Error('passkey-needs-https', 'Passkeys need WeKan at an https:// ROOT_URL.');
  return party;
}

async function saveChallenge(kind, challenge, userId = null) {
  const _id = Random.id(24);
  await PasskeyChallenges.insertAsync({ _id, kind, challenge, userId, expiresAt: new Date(Date.now() + CHALLENGE_MS) });
  return _id;
}

// Single use: taken from the collection, whatever happens next.
async function takeChallenge(_id, kind, userId = null) {
  if (typeof _id !== 'string') return null;
  const doc = await PasskeyChallenges.findOneAsync({ _id, kind });
  if (!doc) return null;
  await PasskeyChallenges.removeAsync({ _id });
  if (doc.expiresAt < new Date() || (userId && doc.userId !== userId)) return null;
  return doc.challenge;
}

Meteor.methods({
  async passkeyList() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { passkeys: 1 } });
    return ((user && user.passkeys) || []).map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt, lastUsedAt: p.lastUsedAt }));
  },

  async passkeyRegistrationOptions() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const { rpID } = rp();
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { username: 1, profile: 1, passkeys: 1 } });
    if ((user.passkeys || []).length >= MAX_PASSKEYS) throw new Meteor.Error('passkey-too-many');
    const options = await generateRegistrationOptions({
      rpName: 'WeKan', rpID,
      userName: user.username || this.userId,
      userDisplayName: (user.profile && user.profile.fullname) || user.username || '',
      userID: new TextEncoder().encode(this.userId),
      attestationType: 'none',
      excludeCredentials: (user.passkeys || []).map(p => ({ id: p.id, transports: p.transports })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    });
    const challengeId = await saveChallenge('register', options.challenge, this.userId);
    return { challengeId, options };
  },

  async passkeyRegister(challengeId, response, name) {
    check(challengeId, String);
    check(response, Object);
    check(name, Match.Optional(String));
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const expectedChallenge = await takeChallenge(challengeId, 'register', this.userId);
    if (!expectedChallenge) throw new Meteor.Error('passkey-expired');
    const { rpID, origin } = rp();
    let verification;
    try {
      verification = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: origin,
        expectedRPID: rpID, requireUserVerification: false });
    } catch (error) {
      throw new Meteor.Error('passkey-invalid');
    }
    if (!verification.verified || !verification.registrationInfo) throw new Meteor.Error('passkey-invalid');
    const { credential } = verification.registrationInfo;
    const taken = await Meteor.users.findOneAsync({ 'passkeys.id': credential.id }, { fields: { _id: 1 } });
    if (taken) throw new Meteor.Error('passkey-exists');
    await Meteor.users.updateAsync({ _id: this.userId, [`passkeys.${MAX_PASSKEYS - 1}`]: { $exists: false } }, { $push: { passkeys: {
      id: credential.id,
      publicKey: bytesToBase64url(credential.publicKey),
      counter: credential.counter || 0,
      transports: Array.isArray(credential.transports) ? credential.transports : [],
      name: passkeyName(name),
      createdAt: new Date(),
    } } });
    return true;
  },

  async passkeyRemove(id) {
    check(id, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    await Meteor.users.updateAsync(this.userId, { $pull: { passkeys: { id } } });
    return true;
  },

  // Anybody may ask: the options name no account (a discoverable passkey
  // tells the browser which one), so they reveal nothing.
  async passkeyLoginOptions() {
    const { rpID } = rp();
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
    const challengeId = await saveChallenge('login', options.challenge);
    return { challengeId, options };
  },
});

// Accounts.callLoginMethod({ methodArguments: [{ passkey: { challengeId, response } }] })
Accounts.registerLoginHandler('passkey', async options => {
  if (!options || !options.passkey) return undefined;
  check(options.passkey, { challengeId: String, response: Object });
  const { challengeId, response } = options.passkey;
  const expectedChallenge = await takeChallenge(challengeId, 'login');
  if (!expectedChallenge || typeof response.id !== 'string') {
    return { error: new Meteor.Error(403, 'passkey-invalid') };
  }
  const user = await Meteor.users.findOneAsync({ 'passkeys.id': response.id }, { fields: { passkeys: 1 } });
  const passkey = user && user.passkeys.find(p => p.id === response.id);
  if (!passkey) {
    return { error: new Meteor.Error(403, 'passkey-invalid') };
  }
  const { rpID, origin } = rp();
  let verification;
  try {
    verification = await verifyAuthenticationResponse({ response, expectedChallenge, expectedOrigin: origin,
      expectedRPID: rpID, requireUserVerification: false,
      credential: { id: passkey.id, publicKey: base64urlToBytes(passkey.publicKey), counter: passkey.counter || 0,
        transports: passkey.transports } });
  } catch (error) {
    verification = null;
  }
  if (!verification || !verification.verified) {
    return { userId: user._id, error: new Meteor.Error(403, 'passkey-invalid') };
  }
  await Meteor.users.updateAsync({ _id: user._id, 'passkeys.id': passkey.id }, { $set: {
    'passkeys.$.counter': verification.authenticationInfo.newCounter, 'passkeys.$.lastUsedAt': new Date() } });
  return { userId: user._id };
});

for (const name of ['passkeyRegistrationOptions', 'passkeyRegister', 'passkeyRemove', 'passkeyLoginOptions', 'passkeyList']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 10, 10000);
}

Meteor.startup(async () => {
  await ensureIndex(PasskeyChallenges, { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await ensureIndex(Meteor.users, { 'passkeys.id': 1 }, { sparse: true });
});
