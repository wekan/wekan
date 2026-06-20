/* eslint-env mocha */
import { expect } from 'chai';
import { canNavigateToSubtaskBoard } from '/client/components/cards/subtaskViewHelpers';

/**
 * Unit tests for the subtask navigation guard.
 *
 * Regression #4762: "Subtask board is not accessible until reload".
 * The js-view-subtask click handler dereferenced the subtask's board
 * (board._id, board.slug) without checking whether the board had been loaded.
 * When the board was not yet in the ReactiveCache, subtask.board() returned a
 * missing/undefined value and navigation threw, only working after a reload.
 * canNavigateToSubtaskBoard mirrors the existing js-go-to-subtask-board guard.
 */
describe('canNavigateToSubtaskBoard (#4762)', function() {
  it('returns false when the board is null (not yet loaded)', function() {
    expect(canNavigateToSubtaskBoard(null)).to.equal(false);
  });

  it('returns false when the board is undefined', function() {
    expect(canNavigateToSubtaskBoard(undefined)).to.equal(false);
  });

  it('returns false for a board object without an _id', function() {
    expect(canNavigateToSubtaskBoard({})).to.equal(false);
    expect(canNavigateToSubtaskBoard({ slug: 'my-board' })).to.equal(false);
  });

  it('returns true for a valid loaded board with an _id', function() {
    expect(canNavigateToSubtaskBoard({ _id: 'abc123', slug: 'my-board' })).to.equal(true);
  });

  it('always returns a Boolean, never a truthy/falsy value', function() {
    expect(canNavigateToSubtaskBoard({ _id: 'abc123' })).to.be.a('boolean');
    expect(canNavigateToSubtaskBoard(null)).to.be.a('boolean');
  });
});
