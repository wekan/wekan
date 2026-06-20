/* eslint-env mocha */
import { expect } from 'chai';
import { canEditComment } from '/models/cardComments';

/**
 * Unit tests for the comment edit/delete permission decision (issue #5906).
 *
 * `canEditComment` is a pure function extracted from models/cardComments.js so
 * the access-control rule can be exercised in isolation. The same function is
 * used by the server-side collection hooks (enforcement) and the client UI
 * (button visibility), so these tests pin the single source of truth.
 *
 * Rules:
 *   - The author may ALWAYS edit/delete their own comment.
 *   - Board admins may edit/delete others' comments ONLY when the board setting
 *     `restrictCommentEditing` is false (the historical default).
 *   - When `restrictCommentEditing` is true, only the author may edit/delete.
 *   - A non-author, non-admin user may never edit/delete.
 */
describe('comment edit/delete permissions (canEditComment)', function() {
  it('author can always edit their own comment (unrestricted)', function() {
    expect(canEditComment({
      isAuthor: true,
      isBoardAdmin: false,
      restrictCommentEditing: false,
    })).to.equal(true);
  });

  it('author can always edit their own comment (even when restricted)', function() {
    expect(canEditComment({
      isAuthor: true,
      isBoardAdmin: false,
      restrictCommentEditing: true,
    })).to.equal(true);
  });

  it('author who is also an admin can always edit when restricted', function() {
    expect(canEditComment({
      isAuthor: true,
      isBoardAdmin: true,
      restrictCommentEditing: true,
    })).to.equal(true);
  });

  it('board admin can edit others\' comments when NOT restricted', function() {
    expect(canEditComment({
      isAuthor: false,
      isBoardAdmin: true,
      restrictCommentEditing: false,
    })).to.equal(true);
  });

  it('board admin can NOT edit others\' comments when restricted', function() {
    expect(canEditComment({
      isAuthor: false,
      isBoardAdmin: true,
      restrictCommentEditing: true,
    })).to.equal(false);
  });

  it('non-author non-admin can never edit (unrestricted)', function() {
    expect(canEditComment({
      isAuthor: false,
      isBoardAdmin: false,
      restrictCommentEditing: false,
    })).to.equal(false);
  });

  it('non-author non-admin can never edit (restricted)', function() {
    expect(canEditComment({
      isAuthor: false,
      isBoardAdmin: false,
      restrictCommentEditing: true,
    })).to.equal(false);
  });

  it('treats missing/undefined flags as falsy (no accidental allow)', function() {
    expect(canEditComment({})).to.equal(false);
    expect(canEditComment({ isBoardAdmin: undefined })).to.equal(false);
  });
});
