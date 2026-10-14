import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import { assignKey } from '/server/boardKeys';

// Board keys (#2449, #2450) on a running server: a board gets a key from its
// title, keys are unique, and a board admin changes one - but not to a key
// another board has, nor to one that is not a key; and not somebody else.
describe('Board keys (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const owner = Random.id(), other = Random.id();
  const a = Random.id(), b = Random.id();
  const tag = Random.id(4).toUpperCase().replace(/[^A-Z]/g, 'Q');

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertMany([
      { _id: owner, username: `bk-owner-${owner}`, profile: {} },
      { _id: other, username: `bk-other-${other}`, profile: {} },
    ]);
    await Boards.rawCollection().insertMany([
      { _id: a, title: `Zeta ${tag} Alpha`, type: 'board', permission: 'private', members: [{ userId: owner, isAdmin: true, isActive: true }] },
      { _id: b, title: `Zeta ${tag} Alpha`, type: 'board', permission: 'private', members: [{ userId: owner, isAdmin: true, isActive: true }] },
    ]);
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Boards.rawCollection().deleteMany({ _id: { $in: [a, b] } });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [owner, other] } });
  });

  it('two boards with the same title get different keys', async () => {
    const ka = await assignKey(a);
    const kb = await assignKey(b);
    assert.match(ka, /^[A-Z][A-Z0-9]{1,9}$/);
    assert.notEqual(ka, kb);
    assert.equal((await Boards.findOneAsync(a)).key, ka);
  });

  it('a board admin changes it; a taken key, a bad key and a non-admin are refused', async () => {
    const kb = (await Boards.findOneAsync(b)).key;
    await assert.rejects(call(owner, 'setBoardKey', a, kb), /board-key-taken/);
    await assert.rejects(call(owner, 'setBoardKey', a, '1x'), /board-key-invalid/);
    await assert.rejects(call(other, 'setBoardKey', a, `K${tag}`), /not-authorized/);
    const key = `K${tag}`.slice(0, 10);
    assert.equal(await call(owner, 'setBoardKey', a, key.toLowerCase()), key, 'typed in lower case, stored in capitals');
    assert.equal((await Boards.findOneAsync(a)).key, key);
  });
});
