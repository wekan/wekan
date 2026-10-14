/* eslint-env mocha */
// #2026 / #1377: web-push loads in Meteor, VAPID keys are made once, and a
// subscription to anything but a browser push service is refused.
import { Meteor } from 'meteor/meteor';
import { expect } from 'chai';

describe('webPush (runtime)', function () {
  it('makes one VAPID key pair and gives out only the public key', async function () {
    const call = name => Meteor.server.method_handlers[name].call({ userId: 'runtime-test-user' });
    const first = await call('webPushPublicKey');
    const second = await call('webPushPublicKey');
    expect(first).to.be.a('string').with.length.greaterThan(40);
    expect(second).to.equal(first);
  });

  it('refuses a subscription to an internal address', async function () {
    let error;
    try {
      await Meteor.server.method_handlers.webPushSubscribe.call({ userId: 'runtime-test-user' },
        { endpoint: 'https://127.0.0.1/x', keys: { p256dh: 'aaaaaaaaaaaa', auth: 'bbbbbbbbbbbb' } });
    } catch (e) { error = e; }
    expect(error && error.error).to.equal('web-push-invalid-subscription');
  });
});
