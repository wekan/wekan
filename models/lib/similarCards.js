'use strict';

// Similar cards and possible duplicates (docs/Features/Cards/Similar-Cards.md):
// letter triples and the Dice coefficient, which other kanban apps sell as AI.
// Letters and digits of every script count, so it works the same in Finnish,
// Japanese or Arabic.
//
// Pure, no Meteor. Tests: tests/similarCards.test.cjs.

const SIMILAR = 0.5;
const DUPLICATE = 0.8;
const TITLE_WEIGHT = 2;
// A description longer than this is cut: the opening of a description says
// what the card is, and the cost of a long one is all in its tail.
const MAX_TEXT = 2000;

const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Tibetan}]/u;

// Lower case, accents off, punctuation to spaces.
function normalizeText(text) {
  return String(text || '')
    .slice(0, MAX_TEXT)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// The set of letter triples of a text, each word padded with spaces so a short
// word still has triples: "printer" -> " pr", "pri", ..., "er ".
function trigrams(text) {
  const out = new Set();
  const normalized = normalizeText(text);
  if (!normalized) return out;
  for (const word of normalized.split(' ')) {
    // Scripts written without spaces between words: one "word" is a whole
    // phrase, so letter pairs say more than triples.
    if (UNSPACED.test(word)) {
      const chars = [...word];
      if (chars.length === 1) out.add(chars[0]);
      for (let i = 0; i + 2 <= chars.length; i += 1) out.add(chars[i] + chars[i + 1]);
      continue;
    }
    const padded = ` ${word} `;
    for (let i = 0; i + 3 <= padded.length; i += 1) out.add(padded.slice(i, i + 3));
  }
  return out;
}

function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const gram of small) if (large.has(gram)) common += 1;
  return (2 * common) / (a.size + b.size);
}

// One number from 0 to 1 for two cards: the title counts TITLE_WEIGHT times,
// the description once, and only when both cards have one.
function similarity(query, card) {
  const titleScore = dice(query.titleGrams, trigrams(card.title));
  if (!query.descriptionGrams || !query.descriptionGrams.size) return titleScore;
  const otherDescription = trigrams(card.description);
  if (!otherDescription.size) return titleScore;
  const descriptionScore = dice(query.descriptionGrams, otherDescription);
  return (TITLE_WEIGHT * titleScore + descriptionScore) / (TITLE_WEIGHT + 1);
}

// The cards like `query` ({ title, description? }), closest first: each
// { _id, title, listId, score, duplicate }. Archived cards and `excludeId`
// are left out; callers pass only the cards the reader may see.
function rankSimilarCards(query, cards, { limit = 5, min = SIMILAR, excludeId = null } = {}) {
  const prepared = {
    titleGrams: trigrams(query && query.title),
    descriptionGrams: trigrams(query && query.description),
  };
  if (!prepared.titleGrams.size) return [];
  const ranked = [];
  for (const card of cards || []) {
    if (!card || card.archived || card._id === excludeId) continue;
    const score = similarity(prepared, card);
    if (score >= min) {
      ranked.push({ _id: card._id, title: card.title, listId: card.listId, score, duplicate: score >= DUPLICATE });
    }
  }
  ranked.sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)));
  return ranked.slice(0, limit);
}

module.exports = { SIMILAR, DUPLICATE, TITLE_WEIGHT, normalizeText, trigrams, dice, rankSimilarCards };
