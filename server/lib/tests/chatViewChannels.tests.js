import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Swimlanes from '/models/swimlanes';

// Board View / Chat, the channel tree (server/chatView.js): which cards
// have a conversation, how much of it this member has not read, and only
// what they may read.
describe('Chat view channels', function () {
  this.timeout(60000);
  it('counts conversations and unread messages, and keeps to what the member may read', async function () {
    if (!Meteor.isAppTest) this.skip();
    const me = Random.id(), friend = Random.id();
    const talk = Random.id(), quiet = Random.id(), muted = Random.id(), limited = Random.id(), hidden = Random.id();
    const boardIds = [talk, quiet, muted, limited, hidden];
    const as = userId => (name, ...args) => DDP._CurrentMethodInvocation.withValue(
      { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} },
      () => Meteor.server.method_handlers[name].apply({ userId }, args));
    const call = as(me);
    const member = (userId, extra = {}) => ({ userId, isAdmin: false, isActive: true, ...extra });
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: me, username: `me-${me}`, profile: { cardLastViews: {} } },
        { _id: friend, username: `friend-${friend}`, profile: {} },
      ]);
      await Boards.rawCollection().insertMany([
        { _id: talk, title: 'Talk', slug: 'talk', type: 'board', archived: false, permission: 'private', members: [member(me), member(friend)] },
        { _id: quiet, title: 'Quiet', slug: 'quiet', type: 'board', archived: false, permission: 'private', members: [member(me)] },
        { _id: muted, title: 'Muted', slug: 'muted', type: 'board', archived: false, permission: 'private', members: [member(me, { isNoComments: true })] },
        { _id: limited, title: 'Limited', slug: 'limited', type: 'board', archived: false, permission: 'private', members: [member(me, { isNormalAssignedOnly: true })] },
        { _id: hidden, title: 'Hidden', slug: 'hidden', type: 'board', archived: false, permission: 'private', members: [member(friend)] },
      ]);
      const lane = boardId => ({ _id: `${boardId}-s`, boardId, title: 'Lane', sort: 0, archived: false });
      const list = boardId => ({ _id: `${boardId}-l`, boardId, title: 'List', sort: 0, archived: false });
      await Swimlanes.rawCollection().insertMany(boardIds.map(lane));
      await Lists.rawCollection().insertMany(boardIds.map(list));
      const card = (boardId, id, title, extra = {}) => ({ _id: id, boardId, swimlaneId: `${boardId}-s`, listId: `${boardId}-l`, title,
        sort: 0, archived: false, ...extra });
      await Cards.rawCollection().insertMany([
        card(talk, 'c-talk', 'Plan'), card(quiet, 'c-quiet', 'Nothing'), card(muted, 'c-muted', 'Secret'),
        card(limited, 'c-mine', 'Mine', { assignees: [me] }), card(limited, 'c-theirs', 'Theirs', { assignees: [friend] }),
        card(hidden, 'c-hidden', 'Hidden'),
      ]);
      const comment = (boardId, cardId, userId, minutesAgo) => ({ _id: Random.id(), boardId, cardId, userId, text: 'x',
        createdAt: new Date(Date.now() - minutesAgo * 60000), modifiedAt: new Date() });
      await CardComments.rawCollection().insertMany([
        comment(talk, 'c-talk', friend, 30), comment(talk, 'c-talk', friend, 5), comment(talk, 'c-talk', me, 4),
        comment(muted, 'c-muted', friend, 1),
        comment(limited, 'c-mine', friend, 1), comment(limited, 'c-theirs', friend, 1),
        comment(hidden, 'c-hidden', friend, 1),
      ]);
      // Read up to 10 minutes ago: one of the friend's two messages is new; mine never counts.
      await Meteor.users.rawCollection().updateOne({ _id: me }, { $set: { 'profile.cardLastViews.c-talk': new Date(Date.now() - 10 * 60000) } });

      const summary = await call('chatViewChannels');
      const byCard = new Map(summary.channels.map(c => [c.cardId, c]));
      assert.deepEqual([byCard.get('c-talk').comments, byCard.get('c-talk').unread], [3, 1]);
      assert.equal(byCard.get('c-mine').unread, 1, 'never opened: every message from others is unread');
      // Negative: no conversation from a board whose role reads no comments,
      // nobody else's card on an assigned-only board, nothing from a board I do not see.
      assert.equal(byCard.has('c-muted'), false);
      assert.equal(byCard.has('c-theirs'), false);
      assert.equal(byCard.has('c-hidden'), false);
      assert.equal(summary.boards.some(b => b._id === hidden), false);
      assert.equal(summary.boards.some(b => b._id === quiet), true, 'a board without a conversation is listed, for Other boards');

      // A whole board, for a board opened with all its cards.
      const full = await call('chatViewBoardChannels', quiet);
      assert.deepEqual(full.cards.map(c => c.title), ['Nothing']);
      assert.deepEqual([full.swimlanes.length, full.lists.length], [1, 1]);
      const mine = await call('chatViewBoardChannels', limited);
      assert.deepEqual(mine.cards.map(c => c.title), ['Mine'], 'assigned-only: only my cards');
      // Negative: not a board I see, and not signed in.
      await assert.rejects(call('chatViewBoardChannels', hidden), /not-authorized/);
      await assert.rejects(as(null)('chatViewChannels'), /not-authorized/);
    } finally {
      for (const model of [Cards, CardComments, Lists, Swimlanes]) await model.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Boards.rawCollection().deleteMany({ _id: { $in: boardIds } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [me, friend] } });
    }
  });
});
