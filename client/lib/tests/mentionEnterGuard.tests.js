/* eslint-env mocha */
import { expect } from 'chai';
import { shouldSubmitOnEnter } from '/client/lib/mentionKeyGuard';

/**
 * Unit tests for the @mention autocomplete Enter guard.
 *
 * Regression #3289 ("@mention user list: select user by pressing Enter key"),
 * #4172 ("Sometimes a card is closed when tagging a user (with @) in a
 * comment") and #5457 ("add comments"): while the mention autocomplete
 * dropdown is open, pressing Enter must SELECT the highlighted suggestion, not
 * submit the comment / close the card.
 *
 * shouldSubmitOnEnter centralises that single decision: Enter may submit only
 * when the autocomplete dropdown is NOT open.
 */
describe('shouldSubmitOnEnter (#3289 / #4172 / #5457)', function() {
  it('does NOT submit while the autocomplete dropdown is open', function() {
    expect(shouldSubmitOnEnter({ autocompleteOpen: true })).to.equal(false);
  });

  it('submits when the autocomplete dropdown is closed', function() {
    expect(shouldSubmitOnEnter({ autocompleteOpen: false })).to.equal(true);
  });

  it('submits when called with no argument (dropdown undefined => closed)', function() {
    expect(shouldSubmitOnEnter()).to.equal(true);
    expect(shouldSubmitOnEnter({})).to.equal(true);
  });

  it('always returns a Boolean', function() {
    expect(shouldSubmitOnEnter({ autocompleteOpen: true })).to.be.a('boolean');
    expect(shouldSubmitOnEnter({ autocompleteOpen: false })).to.be.a('boolean');
  });
});
