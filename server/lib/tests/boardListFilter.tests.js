/* eslint-env mocha */
import { expect } from 'chai';
import {
  isCaretWrappedTitle,
  isUserVisibleBoard,
  filterUserBoards,
} from '/server/lib/boardListFilter';

// #5582: internal helper boards (caret-wrapped titles like `^Subtasks^` and
// non-`board` types such as `list`/`template`) must not appear in user-facing
// board lists or the REST API. These tests cover the pure filtering helper that
// both the client board list and the server REST endpoints rely on.
describe('#5582 boardListFilter', function () {
  describe('isCaretWrappedTitle', function () {
    it('detects caret-wrapped titles', function () {
      expect(isCaretWrappedTitle('^Subtasks^')).to.equal(true);
      expect(isCaretWrappedTitle('^board^')).to.equal(true);
      expect(isCaretWrappedTitle('  ^Subtasks^  ')).to.equal(true);
    });

    it('does not flag normal titles or partial carets', function () {
      expect(isCaretWrappedTitle('My Board')).to.equal(false);
      expect(isCaretWrappedTitle('^OnlyLeading')).to.equal(false);
      expect(isCaretWrappedTitle('OnlyTrailing^')).to.equal(false);
      expect(isCaretWrappedTitle('')).to.equal(false);
      expect(isCaretWrappedTitle(undefined)).to.equal(false);
    });
  });

  describe('isUserVisibleBoard', function () {
    it('includes a normal board', function () {
      expect(
        isUserVisibleBoard({ _id: 'a', type: 'board', title: 'My Board' }),
      ).to.equal(true);
    });

    it('excludes a caret-wrapped title', function () {
      expect(
        isUserVisibleBoard({ _id: 'b', type: 'board', title: '^Subtasks^' }),
      ).to.equal(false);
    });

    it('excludes non-board types (template, list, template-container)', function () {
      expect(
        isUserVisibleBoard({ _id: 'c', type: 'template', title: 'T' }),
      ).to.equal(false);
      expect(
        isUserVisibleBoard({ _id: 'd', type: 'list', title: 'L' }),
      ).to.equal(false);
      expect(
        isUserVisibleBoard({
          _id: 'e',
          type: 'template-container',
          title: 'TC',
        }),
      ).to.equal(false);
    });

    it('excludes invalid/missing boards', function () {
      expect(isUserVisibleBoard(null)).to.equal(false);
      expect(isUserVisibleBoard(undefined)).to.equal(false);
      expect(isUserVisibleBoard('nope')).to.equal(false);
    });
  });

  describe('filterUserBoards', function () {
    it('keeps only normal boards and drops internal ones', function () {
      const boards = [
        { _id: '1', type: 'board', title: 'Alpha' },
        { _id: '2', type: 'board', title: '^Subtasks^' },
        { _id: '3', type: 'template', title: 'Tmpl' },
        { _id: '4', type: 'list', title: 'Some List' },
        { _id: '5', type: 'board', title: 'Beta' },
      ];
      const result = filterUserBoards(boards);
      expect(result.map(b => b._id)).to.deep.equal(['1', '5']);
    });

    it('returns an empty array for non-array input', function () {
      expect(filterUserBoards(null)).to.deep.equal([]);
      expect(filterUserBoards(undefined)).to.deep.equal([]);
      expect(filterUserBoards({})).to.deep.equal([]);
    });
  });
});
