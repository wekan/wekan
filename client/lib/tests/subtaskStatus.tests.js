/* eslint-env mocha */
import { expect } from 'chai';
import { subtaskStatusLabel } from '/client/components/cards/subtaskStatusHelpers';

/**
 * Unit tests for the subtask status label helper.
 *
 * Covers #6091 "Visible status of sub-tasks": next to each subtask we show the
 * list it currently resides in, and the board too when it differs from the
 * parent card's board.
 */
describe('subtaskStatusLabel (#6091)', function () {
  it('returns just the list title when on the same board', function () {
    expect(
      subtaskStatusLabel({ listTitle: 'In Work', boardTitle: 'My Board', sameBoard: true }),
    ).to.equal('In Work');
  });

  it('defaults sameBoard to true', function () {
    expect(subtaskStatusLabel({ listTitle: 'Done' })).to.equal('Done');
  });

  it('prefixes the board title when on a different board', function () {
    expect(
      subtaskStatusLabel({ listTitle: 'Todo', boardTitle: 'Other Board', sameBoard: false }),
    ).to.equal('Other Board / Todo');
  });

  it('trims whitespace from titles', function () {
    expect(
      subtaskStatusLabel({ listTitle: '  Done  ', boardTitle: '  Board  ', sameBoard: false }),
    ).to.equal('Board / Done');
  });

  it('falls back to the board title alone when list is missing on a different board', function () {
    expect(
      subtaskStatusLabel({ listTitle: '', boardTitle: 'Other Board', sameBoard: false }),
    ).to.equal('Other Board');
  });

  it('falls back to the list title alone when board is missing on a different board', function () {
    expect(
      subtaskStatusLabel({ listTitle: 'Todo', boardTitle: '', sameBoard: false }),
    ).to.equal('Todo');
  });

  it('returns an empty string when nothing is known', function () {
    expect(subtaskStatusLabel({})).to.equal('');
    expect(subtaskStatusLabel()).to.equal('');
  });

  it('returns an empty string on the same board when list title is missing', function () {
    expect(subtaskStatusLabel({ boardTitle: 'My Board', sameBoard: true })).to.equal('');
  });
});
