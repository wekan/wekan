'use strict';
const { test } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test.describe('CHECK', () => {
  test('seeded rule renders button on fresh board load', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id });
    try {
      // Seed a board-button rule directly in the DB (no client insert, no /rules visit).
      const tid = 'trg' + Math.random().toString(36).slice(2, 10);
      const aid = 'act' + Math.random().toString(36).slice(2, 10);
      const rid = 'rul' + Math.random().toString(36).slice(2, 10);
      db.mongoEval(
        `db.triggers.insertOne({_id:${db.literal(tid)},boardId:${db.literal(b.boardId)},activityType:'button',buttonType:'board',buttonLabel:'Do the thing',desc:'x',createdAt:new Date(),updatedAt:new Date()});` +
        `db.actions.insertOne({_id:${db.literal(aid)},boardId:${db.literal(b.boardId)},actionType:'moveCardToTop',listTitle:'*',desc:'x',createdAt:new Date(),modifiedAt:new Date()});` +
        `db.rules.insertOne({_id:${db.literal(rid)},boardId:${db.literal(b.boardId)},title:'My board button',triggerId:${db.literal(tid)},actionId:${db.literal(aid)},createdAt:new Date(),modifiedAt:new Date()});`
      );
      await openBoard(loggedInPage, b.boardId, b.slug);
      await loggedInPage.waitForTimeout(2000);
      const r = await loggedInPage.evaluate((bid) => new Promise(resolve => {
        const h = Meteor.subscribe('zzTriggers', bid, { onReady() {
          setTimeout(() => {
            const store = Meteor.connection._stores && Meteor.connection._stores['triggers'];
            let sd = 'nm';
            try { sd = store && store._getCollection ? store._getCollection().find({}).count() : 'no'; } catch(e){ sd='err'; }
            resolve({ ready: h.ready(), syncPubTriggers: sd });
          }, 1000);
        }});
        setTimeout(()=>resolve({timeout:true}), 4000);
      }), b.boardId);
      console.log('SYNCPUB:', JSON.stringify(r));
      const n = await loggedInPage.locator('.js-run-board-button').count();
      console.log('buttons=', n);
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
      db.mongoEval(`db.triggers.deleteMany({boardId:${db.literal(b.boardId)}});db.actions.deleteMany({boardId:${db.literal(b.boardId)}});db.rules.deleteMany({boardId:${db.literal(b.boardId)}});`);
    }
  });
});
