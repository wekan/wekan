/* eslint-env mocha */
// Deleting or anonymizing your own account on a running server: refused while
// Admin Panel / People / Login / "Self delete user account" is off, and never
// for the last site administrator (models/lib/selfAccountRemoval.js).
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import AccountSettings from '/models/accountSettings';

const SETTING = 'accounts-allowUserDelete';

describe('own account deletion follows the self delete setting on the server', function () {
  this.timeout(30000);
  const created = [];
  let saved;

  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId, connection: null }, args);
  const setAllowed = value => AccountSettings.updateAsync({ _id: SETTING }, { $set: { booleanValue: value } });
  const newUser = async (fields = {}) => {
    const id = await Accounts.createUserAsync({ username: `self-${Random.id(8).toLowerCase()}`, password: Random.id(), from: 'admin' });
    if (Object.keys(fields).length) await Meteor.users.updateAsync(id, { $set: fields });
    created.push(id);
    return id;
  };
  const refusedWith = async (fn, reason) => {
    let error;
    try { await fn(); } catch (e) { error = e; }
    expect(error, 'refused').to.be.an('object');
    expect(error.reason).to.equal(reason);
  };

  before(async function () {
    saved = (await AccountSettings.findOneAsync(SETTING))?.booleanValue;
  });
  afterEach(() => sinon.restore());
  after(async function () {
    await setAllowed(saved === true);
    if (created.length) await Meteor.users.removeAsync({ _id: { $in: created } });
  });

  it('refuses removeUser and anonymizeUser on your own account while it is off', async function () {
    await setAllowed(false);
    const me = await newUser();
    await refusedWith(() => call(me, 'removeUser', me), 'Deleting your own account is not allowed');
    await refusedWith(() => call(me, 'anonymizeUser', me), 'Deleting your own account is not allowed');
    const still = await Meteor.users.findOneAsync(me);
    expect(still, 'the account is still there').to.be.an('object');
    expect(still.anonymized).to.not.equal(true);
  });

  it('removes your own account while it is on (negative)', async function () {
    await setAllowed(true);
    const me = await newUser();
    const result = await call(me, 'removeUser', me);
    expect(result.success).to.equal(true);
    expect(await Meteor.users.findOneAsync(me)).to.equal(undefined);
  });

  it('never lets the last site administrator delete or anonymize themselves', async function () {
    await setAllowed(true);
    const admin = await newUser({ isAdmin: true });
    const adminDoc = await Meteor.users.findOneAsync(admin);
    sinon.stub(ReactiveCache, 'getUsers').resolves([adminDoc]);
    await refusedWith(() => call(admin, 'removeUser', admin), 'Cannot delete the last administrator');
    await refusedWith(() => call(admin, 'anonymizeUser', admin), 'Cannot anonymize the last administrator');
    expect(await Meteor.users.findOneAsync(admin)).to.be.an('object');
  });

  it('still lets an administrator delete another user while self delete is off (negative)', async function () {
    await setAllowed(false);
    const admin = await newUser({ isAdmin: true });
    const other = await newUser();
    const result = await call(admin, 'removeUser', other);
    expect(result.success).to.equal(true);
  });
});
