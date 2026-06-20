/* eslint-env mocha */
import { expect } from 'chai';
import { isItemHidden, checklistHideState } from '../checklistHide';

// Issue #5408: the per-checklist "Hide checked items" toggle was reported to
// (1) behave inverted and (2) be applied to ALL checklists in the card.
// These tests pin down the correct, non-inverted, per-checklist semantics.
describe('checklistHide (issue #5408)', function() {
  describe(isItemHidden.name, function() {
    it('hides a checked item when the toggle is on', function() {
      expect(isItemHidden({ isChecked: true, hideChecked: true })).to.equal(true);
    });

    it('keeps a checked item visible when the toggle is off', function() {
      expect(isItemHidden({ isChecked: true, hideChecked: false })).to.equal(false);
    });

    it('keeps an unchecked item visible when the toggle is on', function() {
      expect(isItemHidden({ isChecked: false, hideChecked: true })).to.equal(false);
    });

    it('keeps an unchecked item visible when the toggle is off', function() {
      expect(isItemHidden({ isChecked: false, hideChecked: false })).to.equal(false);
    });

    it('coerces truthy/falsy inputs to a strict boolean', function() {
      expect(isItemHidden({ isChecked: 1, hideChecked: 'yes' })).to.equal(true);
      expect(isItemHidden({ isChecked: 0, hideChecked: 'yes' })).to.equal(false);
      expect(isItemHidden({})).to.equal(false);
      expect(isItemHidden()).to.equal(false);
    });
  });

  describe(checklistHideState.name, function() {
    it('reads the field from the specific checklist passed in', function() {
      const checklistA = { _id: 'A', hideCheckedChecklistItems: true };
      const checklistB = { _id: 'B', hideCheckedChecklistItems: false };
      expect(checklistHideState(checklistA)).to.equal(true);
      expect(checklistHideState(checklistB)).to.equal(false);
    });

    it('does not leak one checklist state onto another', function() {
      // Toggling checklist A on must not change the state read for checklist B.
      const checklists = [
        { _id: 'A', hideCheckedChecklistItems: true },
        { _id: 'B', hideCheckedChecklistItems: undefined },
        { _id: 'C', hideCheckedChecklistItems: false },
      ];
      const states = checklists.map(checklistHideState);
      expect(states).to.deep.equal([true, false, false]);
    });

    it('treats a missing/undefined field as off', function() {
      expect(checklistHideState({ _id: 'X' })).to.equal(false);
      expect(checklistHideState({ _id: 'X', hideCheckedChecklistItems: undefined })).to.equal(false);
    });

    it('returns false for a missing checklist', function() {
      expect(checklistHideState(undefined)).to.equal(false);
      expect(checklistHideState(null)).to.equal(false);
    });

    it('combines with isItemHidden for the full per-checklist decision', function() {
      const checklist = { _id: 'A', hideCheckedChecklistItems: true };
      const hideChecked = checklistHideState(checklist);
      expect(isItemHidden({ isChecked: true, hideChecked })).to.equal(true);
      expect(isItemHidden({ isChecked: false, hideChecked })).to.equal(false);
    });
  });
});
