/* eslint-env mocha */
import { expect } from 'chai';
import { safeDeliver } from '../webhookGuard';

describe('webhookGuard.safeDeliver (bug #1402: outgoing webhook must be non-blocking)', function() {
  it('resolves { ok: true } when the delivery function succeeds', async function() {
    let called = false;
    const result = await safeDeliver(() => {
      called = true;
    });
    expect(called).to.equal(true);
    expect(result).to.deep.equal({ ok: true });
  });

  it('resolves (does NOT reject) when a synchronous deliverFn throws', async function() {
    let rejected = false;
    let result;
    try {
      result = await safeDeliver(() => {
        throw new Error('boom-sync');
      });
    } catch (e) {
      rejected = true;
    }
    expect(rejected).to.equal(false);
    expect(result.ok).to.equal(false);
    expect(result.error).to.be.instanceOf(Error);
    expect(result.error.message).to.equal('boom-sync');
  });

  it('resolves (does NOT reject) when an async deliverFn rejects', async function() {
    let rejected = false;
    let result;
    try {
      result = await safeDeliver(async () => {
        throw new Error('boom-async');
      });
    } catch (e) {
      rejected = true;
    }
    expect(rejected).to.equal(false);
    expect(result.ok).to.equal(false);
    expect(result.error.message).to.equal('boom-async');
  });

  it('resolves { ok: true } when an async deliverFn resolves', async function() {
    const result = await safeDeliver(async () => Promise.resolve('done'));
    expect(result).to.deep.equal({ ok: true });
  });

  it('does not reject when deliverFn is not a function', async function() {
    const result = await safeDeliver(undefined);
    expect(result.ok).to.equal(false);
    expect(result.error).to.be.instanceOf(TypeError);
  });

  it('isolates a failing webhook from the caller (simulates the member-update path)', async function() {
    // Simulate the activity-insert path: the member update has already happened
    // and only afterwards the webhook is delivered. A throwing webhook must not
    // unwind this flow.
    let memberPersisted = false;
    const insertActivityAndDeliver = async () => {
      memberPersisted = true; // member assignment took effect
      await safeDeliver(() => {
        throw new Error('webhook endpoint unreachable');
      });
      return 'completed';
    };
    const outcome = await insertActivityAndDeliver();
    expect(outcome).to.equal('completed');
    expect(memberPersisted).to.equal(true);
  });
});
