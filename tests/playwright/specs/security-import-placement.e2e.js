'use strict';
// ImportPlacementBleed: an import into board A placed beside a list, swimlane
// or card of board B - a board the importer cannot see - created cards on A
// pointing at B's list and swimlane. The reporter's run, by both routes that
// reach the scoped importer: POST /api/import/zip and the importScoped method.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const DOC = { _format: 'wekan-board-1.0.0', cards: [{ _id: 'c1', title: 'planted', listId: 'nolist', swimlaneId: 'nosw' }] };

test('an import is refused beside another board\'s list, swimlane or card, and accepted beside its own', async ({ loggedInPage: page, user, board, user2 }) => {
  const other = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  try {
    const foreignCard = db.findOne('cards', { boardId: other.boardId });
    const JSZip = require('jszip');
    const zip = new JSZip(); zip.file('wekan.json', JSON.stringify(DOC));
    const base64 = (await zip.generateAsync({ type: 'nodebuffer' })).toString('base64');
    const viaZip = query => page.evaluate(async ({ base64, boardId, token, query }) => {
      const body = Uint8Array.from(atob(base64), value => value.charCodeAt(0));
      const response = await fetch(`/api/import/zip?boardId=${encodeURIComponent(boardId)}&authToken=${encodeURIComponent(token)}${query}`, {
        method: 'POST', headers: { 'Content-Type': 'application/zip' }, body,
      });
      return { status: response.status, body: await response.json() };
    }, { base64, boardId: board.boardId, token: user.token, query });
    const viaMethod = target => page.evaluate(async ({ target, doc }) => {
      try { return { ok: await Meteor.callAsync('importScoped', target, doc, null) }; }
      catch (error) { return { error: error.error, reason: error.reason }; }
    }, { target: { boardId: board.boardId, ...target }, doc: DOC });
    const planted = () => db.find('cards', { boardId: board.boardId, title: 'planted' });

    // The attack: board B's list and swimlane, then B's card.
    expect(await viaZip(`&listId=${other.listIds[0]}&swimlaneId=${other.swimlaneId}`))
      .toEqual({ status: 400, body: { error: 'listId does not belong to this board.' } });
    expect(await viaZip(`&swimlaneId=${other.swimlaneId}`))
      .toEqual({ status: 400, body: { error: 'swimlaneId does not belong to this board.' } });
    expect(await viaZip(`&cardId=${foreignCard._id}`))
      .toEqual({ status: 400, body: { error: 'cardId does not belong to this board.' } });
    // negative: the cardId answer is the same for a card that exists elsewhere
    // and for one that exists nowhere - no existence check of B's cards.
    expect(await viaZip('&cardId=doesNotExistAnywhere1'))
      .toEqual({ status: 400, body: { error: 'cardId does not belong to this board.' } });
    expect(await viaMethod({ listId: other.listIds[0], swimlaneId: other.swimlaneId }))
      .toEqual({ error: 'error-import-placement', reason: 'listId does not belong to this board.' });
    expect(await viaMethod({ cardId: foreignCard._id }))
      .toEqual({ error: 'error-import-placement', reason: 'cardId does not belong to this board.' });
    expect(planted()).toHaveLength(0);
    expect(db.find('cards', { listId: { $in: other.listIds }, title: 'planted' })).toHaveLength(0);
    // The refusal is in Admin Panel → Problems, under its Hall of Fame name.
    await expect.poll(() => db.findOne('eventlog', { bleed: 'ImportPlacementBleed', source: 'import:zip' })?.count).toBeGreaterThan(0);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'ImportPlacementBleed', source: 'method:importScoped' })?.count).toBeGreaterThan(0);

    // Beside the board's own list and swimlane, the same import lands there.
    const own = await viaZip(`&listId=${board.listIds[1]}&swimlaneId=${board.swimlaneId}`);
    expect(own.status).toBe(200);
    expect(own.body.counts.cards).toBe(1);
    expect(planted().map(c => [c.listId, c.swimlaneId])).toEqual([[board.listIds[1], board.swimlaneId]]);
    const ownCard = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    expect((await viaMethod({ cardId: ownCard._id })).ok.cards).toBe(1);
    expect(planted().every(c => c.boardId === board.boardId && board.listIds.includes(c.listId))).toBe(true);
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});
