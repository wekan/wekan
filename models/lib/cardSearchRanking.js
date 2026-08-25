'use strict';

// Keep only the best `skip + limit` text matches while a database cursor is
// consumed. This preserves the existing title > description > custom-field
// ranking without retaining every candidate card in Node.js memory.

function cardTextScore(card, regex) {
  if (card.title && regex.test(card.title)) return 10;
  if (card.description && regex.test(card.description)) return 5;
  if (
    Array.isArray(card.customFields) &&
    card.customFields.some(field => field.value && regex.test(String(field.value)))
  ) return 1;
  return 0;
}

function compareRankedCards(a, b) {
  if (b._score !== a._score) return b._score - a._score;
  const byTitle = (a.title || '').localeCompare(b.title || '');
  if (byTitle !== 0) return byTitle;
  return String(a._id).localeCompare(String(b._id));
}

function retainRankedCard(best, card, regex, keep) {
  if (keep <= 0) return;
  const ranked = {
    _id: card._id,
    title: card.title,
    _score: cardTextScore(card, regex),
  };
  let at = best.findIndex(item => compareRankedCards(ranked, item) < 0);
  if (at < 0) at = best.length;
  best.splice(at, 0, ranked);
  if (best.length > keep) best.pop();
}

module.exports = { cardTextScore, compareRankedCards, retainRankedCard };
