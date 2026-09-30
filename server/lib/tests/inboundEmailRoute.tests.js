import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import EventLog from '/models/eventLog';
const { buildReplyToAddress } = require('/server/lib/inboundEmailReplyToken');

// ReplyBleed (GHSA-mc7c-cv99-64h7), over real HTTP: a reply to Alice's
// notification must become Alice's comment only when Alice sent it. The
// advisory's attack - Alice's reply address with Bob's From - used to become a
// comment by Bob; it is now refused and shows in Admin Panel -> Problems.
describe('Reply-by-email webhook (ReplyBleed)', function () {
  this.timeout(30000);
  const saved = {};
  const env = { WITH_API: 'true', INBOUND_EMAIL_HMAC_SECRET: `secret-${Random.id()}`, INBOUND_EMAIL_WEBHOOK_SECRET: '' };
  before(function () {
    if (!Meteor.isAppTest) this.skip();
    for (const key of Object.keys(env)) { saved[key] = process.env[key]; process.env[key] = env[key]; }
  });
  after(function () {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
  });
  const post = (body, { query = '', headers = {} } = {}) => fetch(Meteor.absoluteUrl(`api/inbound-email${query}`), {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const problems = () => EventLog.rawCollection().findOne({ stream: 'security', bleed: 'ReplyBleed' });
  async function problemCountAfter(before) {
    for (let i = 0; i < 40; i++) {
      const row = await problems();
      if ((row?.count || 0) > before) return row.count;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return (await problems())?.count || 0;
  }

  it('attributes a reply to the token recipient and refuses a spoofed sender', async function () {
    const alice = Random.id(), bob = Random.id(), boardId = Random.id(), cardId = Random.id();
    const aliceMail = `alice-${alice}@example.test`, bobMail = `bob-${bob}@example.test`;
    await Meteor.users.rawCollection().insertMany([
      { _id: alice, username: `alice-${alice}`, emails: [{ address: aliceMail, verified: true }], profile: {} },
      { _id: bob, username: `bob-${bob}`, emails: [{ address: bobMail, verified: true }], profile: {} },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Reply', permission: 'private', archived: false,
      members: [{ userId: alice, isAdmin: false, isActive: true }, { userId: bob, isAdmin: false, isActive: true }] });
    await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId: 'l', swimlaneId: 's', title: 'Card',
      archived: false, sort: 0, userId: alice, assignees: [] });
    const to = buildReplyToAddress({ cardId, userId: alice, secret: env.INBOUND_EMAIL_HMAC_SECRET, domain: 'reply.example.test' });
    const comments = () => CardComments.find({ cardId }).fetchAsync();
    try {
      // The advisory's attack: Alice's reply address, Bob's From.
      const before = (await problems())?.count || 0;
      const spoofed = await post({ to, from: bobMail, text: 'posted as someone else' });
      assert.equal(spoofed.status, 403);
      assert.deepEqual(await comments(), [], 'no comment is created for a spoofed sender');
      assert.ok(await problemCountAfter(before) > before, 'the attempt is visible in Admin Panel -> Problems');

      // A forged recipient in the token is refused too.
      const forged = to.replace(alice, bob);
      assert.equal((await post({ to: forged, from: bobMail, text: 'forged' })).status, 403);

      // Alice herself: the comment is hers.
      const ok = await post({ to, from: `Alice <${aliceMail.toUpperCase()}>`, text: 'Mine\n\nOn Monday someone wrote:\n> quoted' });
      assert.equal(ok.status, 200);
      const [comment] = await comments();
      assert.deepEqual([comment.userId, comment.text, comment.boardId], [alice, 'Mine', boardId]);

      // Alice after losing comment access: refused.
      await Boards.rawCollection().updateOne({ _id: boardId, 'members.userId': alice }, { $set: { 'members.$.isReadOnly': true } });
      assert.equal((await post({ to, from: aliceMail, text: 'no longer allowed' })).status, 403);
      await Boards.rawCollection().updateOne({ _id: boardId, 'members.userId': alice }, { $set: { 'members.$.isReadOnly': false } });

      // With a provider secret configured, only the provider may post.
      process.env.INBOUND_EMAIL_WEBHOOK_SECRET = 'provider-secret';
      assert.equal((await post({ to, from: aliceMail, text: 'no secret' })).status, 401);
      assert.equal((await post({ to, from: aliceMail, text: 'wrong' }, { query: '?secret=provider-secre' })).status, 401);
      assert.equal((await post({ to, from: aliceMail, text: 'by header' }, { headers: { 'x-wekan-inbound-secret': 'provider-secret' } })).status, 200);
      assert.equal((await post({ to, from: aliceMail, text: 'by query' }, { query: '?secret=provider-secret' })).status, 200);
      assert.deepEqual((await comments()).map(row => row.userId), [alice, alice, alice]);
    } finally {
      process.env.INBOUND_EMAIL_WEBHOOK_SECRET = '';
      await CardComments.rawCollection().deleteMany({ cardId });
      await Cards.rawCollection().deleteOne({ _id: cardId });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [alice, bob] } });
    }
  });
});
