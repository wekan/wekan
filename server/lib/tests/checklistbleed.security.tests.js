/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import {
  denyCrossBoardMoveByCard,
  denyCrossBoardMoveByChecklistItem,
  sourceBoardOfCardChild,
} from '/server/lib/utils';

// Security regression test for GHSA-gv8h-5p3p-6hx7 (ChecklistBleed):
// a DDP client must not be able to move a Checklist / ChecklistItem onto a card
// in a private board it cannot write to, by $set-ting a new cardId / checklistId
// (boardId is then denormalized from the destination card). The deny helpers must
// return true (DENY) for such cross-board moves and false (ALLOW) for legitimate
// same-board edits and moves into boards the caller can write to.
describe('ChecklistBleed — checklist/item cross-board move deny rules (GHSA-gv8h-5p3p-6hx7)', function() {
  const ATTACKER = 'attacker';

  // Board the attacker is a write-capable member of.
  const sourceBoard = {
    members: [{ userId: ATTACKER, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false }],
  };
  // Private board the attacker is NOT a member of.
  const victimBoard = {
    members: [{ userId: 'victim', isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false }],
  };

  const boards = { sourceBoard, victimBoard };
  const cards = {
    attackerCard: { _id: 'attackerCard', boardId: 'sourceBoard' },
    victimCard: { _id: 'victimCard', boardId: 'victimBoard' },
  };
  const checklists = {
    victimChecklist: { _id: 'victimChecklist', cardId: 'victimCard' },
    attackerChecklist: { _id: 'attackerChecklist', cardId: 'attackerCard' },
  };

  beforeEach(function() {
    sinon.stub(Boards, 'findOneAsync').callsFake(async id => boards[id] || null);
    sinon.stub(Cards, 'findOneAsync').callsFake(async id => cards[id] || null);
    sinon.stub(Checklists, 'findOneAsync').callsFake(async id => checklists[id] || null);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('denyCrossBoardMoveByCard (Checklists)', function() {
    it('DENIES moving a checklist to a card in a board the caller cannot write to', async function() {
      const denied = await denyCrossBoardMoveByCard(ATTACKER, { $set: { cardId: 'victimCard' } });
      expect(denied).to.equal(true);
    });

    it('DENIES a direct boardId change to an unwritable board', async function() {
      const denied = await denyCrossBoardMoveByCard(ATTACKER, { $set: { boardId: 'victimBoard' } });
      expect(denied).to.equal(true);
    });

    it('DENIES a move to an unknown (non-existent) card id (fail closed)', async function() {
      const denied = await denyCrossBoardMoveByCard(ATTACKER, { $set: { cardId: 'doesNotExist' } });
      expect(denied).to.equal(true);
    });

    it('ALLOWS a same-board move to a card the caller can write to', async function() {
      const denied = await denyCrossBoardMoveByCard(ATTACKER, { $set: { cardId: 'attackerCard' } });
      expect(denied).to.equal(false);
    });

    it('ALLOWS an unrelated edit that does not move the document', async function() {
      const denied = await denyCrossBoardMoveByCard(ATTACKER, { $set: { title: 'renamed' } });
      expect(denied).to.equal(false);
    });
  });

  describe('denyCrossBoardMoveByChecklistItem (ChecklistItems)', function() {
    it('DENIES re-parenting an item to a checklist on an unwritable board', async function() {
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER, { $set: { checklistId: 'victimChecklist' } });
      expect(denied).to.equal(true);
    });

    it('DENIES moving an item to a card in an unwritable board', async function() {
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER, { $set: { cardId: 'victimCard' } });
      expect(denied).to.equal(true);
    });

    it('ALLOWS re-parenting to a checklist on a board the caller can write to', async function() {
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER, { $set: { checklistId: 'attackerChecklist' } });
      expect(denied).to.equal(false);
    });

    // #6813: a comment-only member or Worker reordering items on their own
    // card - the drag sets cardId/checklistId to where the item already is. The
    // allow rule decides that; the cross-board canary must not fire.
    it('does not call a drag within the item\'s own board a cross-board move (#6813)', async function() {
      const source = await sourceBoardOfCardChild({ cardId: 'victimCard' });
      expect(source).to.equal('victimBoard');
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER,
        { $set: { cardId: 'victimCard', checklistId: 'victimChecklist' } }, source);
      expect(denied).to.equal(false);
    });

    it('still DENIES a move off the item\'s own board to an unwritable one (#6813)', async function() {
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER,
        { $set: { checklistId: 'victimChecklist' } }, await sourceBoardOfCardChild({ cardId: 'attackerCard' }));
      expect(denied).to.equal(true);
    });

    // The source is the item's CARD's board, never its own boardId: an item on
    // the attacker's card carrying the victim board's id is still a move into
    // the victim board.
    it('still DENIES a move onto a victim card for an item whose own boardId names the victim board (#6813)', async function() {
      const forged = { cardId: 'attackerCard', boardId: 'victimBoard' };
      const source = await sourceBoardOfCardChild(forged);
      expect(source).to.equal('sourceBoard');
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER,
        { $set: { cardId: 'victimCard', checklistId: 'victimChecklist' } }, source);
      expect(denied).to.equal(true);
    });

    it('skips nothing when the source card is gone (#6813)', async function() {
      expect(await sourceBoardOfCardChild({ cardId: 'doesNotExist' })).to.equal(null);
      const denied = await denyCrossBoardMoveByChecklistItem(ATTACKER, { $set: { cardId: 'victimCard' } }, null);
      expect(denied).to.equal(true);
    });
  });
});
