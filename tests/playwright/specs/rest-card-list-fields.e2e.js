'use strict';
// #6928: the REST card lists of a list and of a swimlane carry modifiedAt,
// dateLastActivity, labelIds, members and customFields, so a syncing client
// needs no GET per card - and an admin-only custom field's value stays
// concealed from a member who is not a board admin, as on the single-card GET.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const auth = token => ({ headers: { Authorization: `Bearer ${token}` } });

test('list and swimlane card lists carry the sync fields; admin-only values stay concealed', async ({ request, user, user2 }) => {
  const board = db.seedBoard({ ownerId: user.id, listCount: 1, cardTitlesPerList: [['Synced card']] });
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    const card = db.findOne('cards', { boardId: board.boardId });
    const secret = db.uid('secret'), open = db.uid('open');
    for (const [id, adminOnly] of [[secret, true], [open, false]]) db.insertOne('customFields', {
      _id: id, boardIds: [board.boardId], name: adminOnly ? 'Secret budget' : 'Public note', type: 'text', settings: {}, adminOnly,
    });
    const at = new Date('2026-11-19T10:00:00Z');
    db.updateOne('cards', { _id: card._id }, { $set: {
      labelIds: ['e2eLabel'], members: [user.id], modifiedAt: at, dateLastActivity: at,
      customFields: [{ _id: secret, value: 'CLASSIFIED-6928' }, { _id: open, value: 'VISIBLE' }],
    } });
    const urls = [`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`,
      `/api/boards/${board.boardId}/swimlanes/${board.swimlaneId}/cards`];
    for (const url of urls) {
      const res = await request.get(url, auth(user.token));
      expect(res.status(), url).toBe(200);
      const [item] = (await res.json()).filter(c => c._id === card._id);
      expect(item.labelIds).toEqual(['e2eLabel']);
      expect(item.members).toEqual([user.id]);
      expect(new Date(item.modifiedAt).toISOString()).toBe(at.toISOString());
      expect(new Date(item.dateLastActivity).toISOString()).toBe(at.toISOString());
      // The board admin reads both values.
      expect(item.customFields).toEqual([{ _id: secret, value: 'CLASSIFIED-6928' }, { _id: open, value: 'VISIBLE' }]);
      // Negative: a member who is not a board admin gets the admin-only one as null.
      const member = await request.get(url, auth(user2.token));
      expect(member.status(), url).toBe(200);
      const text = await member.text();
      expect(text).not.toContain('CLASSIFIED-6928');
      const [seen] = JSON.parse(text).filter(c => c._id === card._id);
      expect(seen.customFields).toEqual([{ _id: secret, value: null }, { _id: open, value: 'VISIBLE' }]);
    }
  } finally {
    db.deleteMany('customFields', { boardIds: board.boardId });
    db.cleanup({ boardIds: [board.boardId] });
  }
});
