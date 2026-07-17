/* eslint-env mocha */
import { expect } from 'chai';
import { subtaskNavTarget } from '/client/components/cards/subtaskViewHelpers';

/**
 * Unit tests for the subtask "View it" navigation target.
 *
 * Regression #3743: "[UX Bug] Subtask 'View it' button opens the parent card
 * instead of the subtask". The js-view-subtask handler must navigate to the
 * SUBTASK card's own board/slug/id, never to the parent (current) card's.
 *
 * subtaskNavTarget(subtask) returns the FlowRouter 'card' route params derived
 * exclusively from the subtask. These tests build a subtask whose own ids are
 * deliberately different from a "parent" card's ids and assert the result
 * carries the subtask's ids, not the parent's.
 */

// A parent card whose ids must NOT leak into the navigation target.
const parentCard = {
  _id: 'parentCardId',
  boardId: 'parentBoardId',
};

// Build a subtask stub that mimics the Card model surface the helper uses:
// board() (with _id + slug), getRealId(), swimlaneId and listId.
function makeSubtask({ withRealId = true } = {}) {
  const subtaskBoard = { _id: 'subtaskBoardId', slug: 'subtask-board-slug' };
  return {
    _id: 'subtaskCardId',
    parentId: parentCard._id,
    boardId: subtaskBoard._id,
    swimlaneId: 'subtaskSwimlaneId',
    listId: 'subtaskListId',
    board() {
      return subtaskBoard;
    },
    getRealId() {
      return withRealId ? 'subtaskRealId' : undefined;
    },
  };
}

describe('subtaskNavTarget (#3743)', function() {
  it('targets the subtask\'s own board, not the parent card\'s board', function() {
    const target = subtaskNavTarget(makeSubtask());
    expect(target.boardId).to.equal('subtaskBoardId');
    expect(target.boardId).to.not.equal(parentCard.boardId);
  });

  it('targets the subtask card itself, not the parent card', function() {
    const target = subtaskNavTarget(makeSubtask());
    // Uses the subtask's real id and never the parent card id.
    expect(target.cardId).to.equal('subtaskRealId');
    expect(target.cardId).to.not.equal(parentCard._id);
  });

  it('uses the subtask board slug, swimlane and list', function() {
    const target = subtaskNavTarget(makeSubtask());
    expect(target.slug).to.equal('subtask-board-slug');
    expect(target.swimlaneId).to.equal('subtaskSwimlaneId');
    expect(target.listId).to.equal('subtaskListId');
  });

  it('falls back to subtask._id when getRealId yields nothing', function() {
    const target = subtaskNavTarget(makeSubtask({ withRealId: false }));
    expect(target.cardId).to.equal('subtaskCardId');
    expect(target.cardId).to.not.equal(parentCard._id);
  });

  it('falls back to the subtask boardId when its board is not loaded (#1853/#4762)', function() {
    // The deposit/target board is often ANOTHER board that is not in
    // minimongo while the parent board is open; navigation must still work
    // (the card route loads the board), it must not throw or no-op.
    const subtask = makeSubtask();
    subtask.board = () => undefined;
    const target = subtaskNavTarget(subtask);
    expect(target.boardId).to.equal('subtaskBoardId');
    expect(target.slug).to.equal('board');
    expect(target.cardId).to.equal('subtaskRealId');
  });

  it('returns undefined for a missing subtask', function() {
    expect(subtaskNavTarget(undefined)).to.equal(undefined);
    expect(subtaskNavTarget(null)).to.equal(undefined);
  });

  it('returns undefined for a broken subtask with no board reference at all', function() {
    const subtask = makeSubtask();
    subtask.board = () => undefined;
    subtask.boardId = undefined;
    expect(subtaskNavTarget(subtask)).to.equal(undefined);
  });
});
