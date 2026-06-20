/**
 * Pure, dependency-free card text-matching helper.
 *
 * Single source of truth for "does this card match a free-text query",
 * shared by board-level and global search so both behave consistently.
 *
 * #5910: board-level search must also match text inside card comments,
 * exactly like global search does. The query is matched (case-insensitively)
 * against the card title, description, AND every comment text.
 *
 * This module intentionally has NO Meteor / collection imports so it can be
 * imported directly by unit tests (mocha + chai) without a running app.
 *
 * @param {Object} card
 * @param {string} [card.title]
 * @param {string} [card.description]
 * @param {string[]} [card.commentTexts] - texts of the card's comments
 * @param {string} query - free-text query
 * @returns {boolean} true if the query matches title, description or any comment
 */
export function cardMatchesQuery(card, query) {
  const c = card || {};
  const q = (query == null ? '' : String(query)).toLowerCase();

  // Empty query matches everything (mirrors existing search.logic behaviour).
  if (q === '') {
    return true;
  }

  const haystacks = [];

  if (c.title) {
    haystacks.push(String(c.title));
  }
  if (c.description) {
    haystacks.push(String(c.description));
  }
  if (Array.isArray(c.commentTexts)) {
    for (const t of c.commentTexts) {
      if (t) {
        haystacks.push(String(t));
      }
    }
  }

  return haystacks.some(h => h.toLowerCase().includes(q));
}
