/* eslint-env mocha */
import { expect } from 'chai';
import {
  brokenCardsSelector,
  repairableCardsSelector,
  unfixableCardsSelector,
  isBrokenCard,
  planBrokenCardRepair,
} from '/models/lib/brokenCardsRepair';

// Unit tests for the shared "broken card" rule behind Admin Panel → Problems →
// Summary ("Broken cards N" + the Repair button).
//
// The property that matters: the COUNT and the REPAIR must agree about which
// cards they mean. Before this module they were two hand-written selectors, and
// the repair covered a strictly smaller set than the count, so the count could
// never reach zero no matter how often a repair ran.
describe('brokenCardsRepair', function() {
  describe('brokenCardsSelector', function() {
    it('matches a missing board, swimlane or list', function() {
      const sel = brokenCardsSelector();
      const fields = sel.$or.map(clause => Object.keys(clause)[0]);
      expect(fields).to.have.members(['boardId', 'swimlaneId', 'listId']);
      sel.$or.forEach(clause => {
        // null AND empty string both count as missing.
        expect(Object.values(clause)[0]).to.deep.equal({ $in: [null, ''] });
      });
    });
  });

  describe('isBrokenCard', function() {
    it('treats null, empty string and an absent field as missing', function() {
      expect(isBrokenCard({ boardId: null, swimlaneId: 's', listId: 'l' })).to.equal(true);
      expect(isBrokenCard({ boardId: '', swimlaneId: 's', listId: 'l' })).to.equal(true);
      expect(isBrokenCard({ swimlaneId: 's', listId: 'l' })).to.equal(true);
      expect(isBrokenCard({ boardId: 'b', swimlaneId: null, listId: 'l' })).to.equal(true);
      expect(isBrokenCard({ boardId: 'b', swimlaneId: 's', listId: '' })).to.equal(true);
    });

    it('does not flag a complete card (negative)', function() {
      expect(isBrokenCard({ boardId: 'b', swimlaneId: 's', listId: 'l' })).to.equal(false);
    });

    it('does not throw on null / undefined input (negative)', function() {
      expect(isBrokenCard(null)).to.equal(false);
      expect(isBrokenCard(undefined)).to.equal(false);
    });
  });

  describe('planBrokenCardRepair', function() {
    it('plans a list for a card missing only its listId', function() {
      const plan = planBrokenCardRepair([
        { _id: 'c1', boardId: 'b1', swimlaneId: 's1', listId: '' },
      ]);
      expect(plan.needsList).to.deep.equal(['c1']);
      expect(plan.needsSwimlane).to.deep.equal([]);
      expect(plan.unfixable).to.deep.equal([]);
      expect(plan.boardIds).to.deep.equal(['b1']);
    });

    it('plans both when a card is missing its list AND its swimlane', function() {
      const plan = planBrokenCardRepair([
        { _id: 'c1', boardId: 'b1' },
      ]);
      expect(plan.needsList).to.deep.equal(['c1']);
      expect(plan.needsSwimlane).to.deep.equal(['c1']);
    });

    it('reports a card with no board as unfixable and never plans a write for it', function() {
      const plan = planBrokenCardRepair([
        { _id: 'orphan', boardId: null, swimlaneId: '', listId: '' },
      ]);
      expect(plan.unfixable).to.deep.equal(['orphan']);
      expect(plan.needsList).to.deep.equal([]);
      expect(plan.needsSwimlane).to.deep.equal([]);
      expect(plan.boardIds).to.deep.equal([]);
    });

    it('de-duplicates boardIds so each board resolves its default list once', function() {
      const plan = planBrokenCardRepair([
        { _id: 'c1', boardId: 'b1', listId: '' },
        { _id: 'c2', boardId: 'b1', listId: '' },
        { _id: 'c3', boardId: 'b2', listId: '' },
      ]);
      expect(plan.boardIds).to.have.members(['b1', 'b2']);
      expect(plan.boardIds).to.have.lengthOf(2);
    });

    it('ignores healthy cards and junk entries (negative)', function() {
      const plan = planBrokenCardRepair([
        { _id: 'ok', boardId: 'b1', swimlaneId: 's1', listId: 'l1' },
        null,
        undefined,
        { boardId: 'b1' }, // no _id: nothing can be updated
      ]);
      expect(plan.needsList).to.deep.equal([]);
      expect(plan.needsSwimlane).to.deep.equal([]);
      expect(plan.unfixable).to.deep.equal([]);
      expect(plan.boardIds).to.deep.equal([]);
    });

    it('returns an empty plan for non-array input (negative)', function() {
      expect(planBrokenCardRepair(undefined).needsList).to.deep.equal([]);
      expect(planBrokenCardRepair(null).unfixable).to.deep.equal([]);
      expect(planBrokenCardRepair('nope').boardIds).to.deep.equal([]);
    });
  });

  // The regression this whole module exists for: every card the count reports as
  // broken must be either repairable or explicitly unfixable — never silently
  // neither, which is what left "Broken cards 68" stuck with no way to clear it.
  describe('the count and the repair cover the same cards', function() {
    const cards = [
      { _id: 'a', boardId: 'b1', swimlaneId: 's1', listId: 'l1' }, // healthy
      { _id: 'b', boardId: 'b1', swimlaneId: '', listId: 'l1' },   // no swimlane
      { _id: 'c', boardId: 'b1', swimlaneId: 's1', listId: null }, // no list
      { _id: 'd', boardId: 'b1' },                                 // neither
      { _id: 'e', boardId: '', swimlaneId: 's1', listId: 'l1' },   // no board
    ];

    it('accounts for every broken card exactly once', function() {
      const broken = cards.filter(isBrokenCard).map(c => c._id);
      expect(broken).to.have.members(['b', 'c', 'd', 'e']);

      const plan = planBrokenCardRepair(cards);
      const handled = new Set([...plan.needsList, ...plan.needsSwimlane, ...plan.unfixable]);
      broken.forEach(id => {
        expect(handled.has(id), `broken card ${id} is not handled by the repair`).to.equal(true);
      });
      // ...and the healthy card is never touched.
      expect(handled.has('a')).to.equal(false);
    });

    it('splits the broken cards into the repairable and unfixable selectors', function() {
      // Repairable = has a board, missing a list or a swimlane.
      expect(repairableCardsSelector()).to.deep.equal({
        boardId: { $nin: [null, ''] },
        $or: [{ listId: { $in: [null, ''] } }, { swimlaneId: { $in: [null, ''] } }],
      });
      // Unfixable = no board at all.
      expect(unfixableCardsSelector()).to.deep.equal({ boardId: { $in: [null, ''] } });
    });
  });
});
