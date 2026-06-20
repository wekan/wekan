/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import {
  denyCrossBoardMoveByCard,
  denyCrossBoardMoveByChecklistItem,
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
  });
});
