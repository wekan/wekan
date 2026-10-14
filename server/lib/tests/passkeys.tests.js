/* eslint-env mocha */
// #5847: the passkey server loads in Meteor - @simplewebauthn/server bundled
// and the methods registered - and anonymous login options name no account.
import { Meteor } from 'meteor/meteor';
import { expect } from 'chai';

describe('passkeys (runtime)', function () {
  it('offers login options with a stored single-use challenge', async function () {
    const handler = Meteor.server.method_handlers.passkeyLoginOptions;
    expect(handler, 'passkeyLoginOptions is registered').to.be.a('function');
    const { challengeId, options } = await handler.call({ userId: null });
    expect(challengeId).to.be.a('string');
    expect(options.challenge).to.be.a('string');
    expect(options.allowCredentials || []).to.have.length(0, 'no account is named');
    const { PasskeyChallenges } = require('/server/passkeys');
    const saved = await PasskeyChallenges.findOneAsync(challengeId);
    expect(saved.kind).to.equal('login');
    expect(saved.expiresAt.getTime()).to.be.greaterThan(Date.now());
  });

  it('refuses registration without a signed-in user', async function () {
    let error;
    try { await Meteor.server.method_handlers.passkeyRegistrationOptions.call({ userId: null }); } catch (e) { error = e; }
    expect(error && error.error).to.equal('not-logged-in');
  });
});
