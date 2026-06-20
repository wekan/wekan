/* eslint-env mocha */
import { expect } from 'chai';
import { canArchiveCard } from '../../../client/lib/archivePermission';

/**
 * Unit tests for the card archive permission helper (#5810).
 *
 * Bug: a board member with the comment-only role could send cards to the
 * archive because the `.js-archive` click handler in cardDetails.js lacked the
 * Utils.canModifyCard() guard that the other mutating handlers have.
 *
 * canArchiveCard() is the pure, Meteor-free helper the handler now consults.
 * Utils.canModifyCard() is false for comment-only (and read-only / worker)
 * users, so archiving must be denied in that case and allowed for full
 * members.
 */
describe('card archive permission (#5810)', function() {
  it('denies archiving for a comment-only user (canModifyCard=false)', function() {
    expect(canArchiveCard({ canModifyCard: false })).to.equal(false);
  });

  it('allows archiving for a board member with write access (canModifyCard=true)', function() {
    expect(canArchiveCard({ canModifyCard: true })).to.equal(true);
  });

  it('denies archiving when permission info is missing', function() {
    expect(canArchiveCard()).to.equal(false);
    expect(canArchiveCard({})).to.equal(false);
  });

  it('coerces the result to a strict boolean', function() {
    expect(canArchiveCard({ canModifyCard: undefined })).to.equal(false);
    expect(canArchiveCard({ canModifyCard: 1 })).to.equal(true);
  });
});
