/* eslint-env mocha */
import { expect } from 'chai';
import { cardMatchesQuery } from '../cardMatch';

/**
 * #5910 - Board-level search must include card comments.
 *
 * Global search already matches text inside card comments; board-level search
 * must do the same for consistency. `cardMatchesQuery` is the pure helper that
 * encodes the shared rule: a card matches when the query (case-insensitively)
 * appears in its title, its description, OR any of its comment texts.
 *
 * These tests are fully self-contained (no Meteor / DB), like search.logic.tests.js.
 */
describe('#5910 board search: cardMatchesQuery includes comments', function() {
  it('matches when the query is in the title', function() {
    const card = { title: 'Fix login bug', description: '', commentTexts: [] };
    expect(cardMatchesQuery(card, 'login')).to.equal(true);
  });

  it('matches when the query is in the description', function() {
    const card = { title: 'Card', description: 'Users cannot log in', commentTexts: [] };
    expect(cardMatchesQuery(card, 'cannot log in')).to.equal(true);
  });

  it('matches when the query is only in a comment (the #5910 fix)', function() {
    const card = {
      title: 'Card',
      description: 'something else',
      commentTexts: ['please check the payment gateway', 'second comment'],
    };
    expect(cardMatchesQuery(card, 'payment gateway')).to.equal(true);
  });

  it('matches a query found in any of several comments', function() {
    const card = {
      title: 'Card',
      description: '',
      commentTexts: ['first', 'second mentions widget', 'third'],
    };
    expect(cardMatchesQuery(card, 'widget')).to.equal(true);
  });

  it('does not match when the query is absent from title, description and comments', function() {
    const card = {
      title: 'Fix login bug',
      description: 'Users cannot log in',
      commentTexts: ['unrelated comment', 'another one'],
    };
    expect(cardMatchesQuery(card, 'payment')).to.equal(false);
  });

  it('is case-insensitive across title, description and comments', function() {
    expect(cardMatchesQuery({ title: 'Alpha Card' }, 'ALPHA')).to.equal(true);
    expect(cardMatchesQuery({ description: 'Some COLORS here' }, 'colors')).to.equal(true);
    expect(
      cardMatchesQuery({ commentTexts: ['Mentions a Gateway'] }, 'GATEWAY'),
    ).to.equal(true);
  });

  it('handles missing/empty fields gracefully', function() {
    expect(cardMatchesQuery({}, 'anything')).to.equal(false);
    expect(cardMatchesQuery({ title: '' }, 'x')).to.equal(false);
    expect(cardMatchesQuery(undefined, 'x')).to.equal(false);
    expect(cardMatchesQuery({ commentTexts: [null, undefined, ''] }, 'x')).to.equal(false);
  });

  it('treats an empty query as matching everything', function() {
    expect(cardMatchesQuery({ title: 'whatever' }, '')).to.equal(true);
    expect(cardMatchesQuery({}, '')).to.equal(true);
  });
});
