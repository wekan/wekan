'use strict';
// #3257: a card attached to another card - Trello's "card attachment". A card
// keeps the ids of the cards attached to it (`attachedCardIds`); they are shown
// beside its file attachments, each as the attached card's title, board and
// list, and open that card. Any card the user can read may be attached, on any
// board: who may SEE an attached card's title is decided where it is shown
// (server/models/attachedCards.js), never by the list itself.
//
// Pure, isomorphic, dependency-free apart from the card-URL parser:
// tests/attachedCards.test.cjs.
const { findCardUrlMatches } = require('./cardUrlAutolink');

const MAX_ATTACHED_CARDS = 100;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

// The stored list: ids only, each once, never the card itself, at most MAX.
function normalizeAttachedCardIds(ids, ownId) {
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== 'string' || !ID.test(id) || id === ownId || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_ATTACHED_CARDS) break;
  }
  return out;
}

// What the user typed or pasted to attach a card: a WeKan card link (as Copy
// card link gives it) or a bare card id. Returns the card id, or null.
function attachedCardIdFrom(input) {
  const text = String(input == null ? '' : input).trim();
  if (!text) return null;
  const [found] = findCardUrlMatches(text);
  if (found && found.cardId && ID.test(found.cardId)) return found.cardId;
  return ID.test(text) ? text : null;
}

// A Trello card link - trello.com/c/<shortLink>[/<number>-<slug>] - as
// a Trello export writes a card attached to a card. Returns the short link.
const TRELLO_CARD_URL = /^https?:\/\/(?:www\.)?trello\.com\/c\/([A-Za-z0-9]{6,12})(?:[/?#]|$)/i;
function trelloCardShortLink(url) {
  const match = TRELLO_CARD_URL.exec(String(url == null ? '' : url).trim());
  return match ? match[1] : null;
}

// Trello card attachments of one imported board, resolved to the WeKan cards
// made from the same export. `trelloCards`: the export's cards ({ id,
// shortLink }); `cardIds`: Trello card id -> WeKan card id, as the importer
// made them; `pending`: [{ cardId (WeKan), shortLink, url }] in order. Returns
// { attach: { wekanCardId: [attached ids] }, unresolved: [{ cardId, url }] } -
// a card of another board, or one the export does not hold, stays a link.
function resolveTrelloCardAttachments(trelloCards, cardIds, pending) {
  const byShortLink = new Map();
  for (const card of Array.isArray(trelloCards) ? trelloCards : []) {
    if (card && card.shortLink && cardIds && cardIds[card.id]) byShortLink.set(card.shortLink, cardIds[card.id]);
  }
  const attach = {};
  const unresolved = [];
  for (const item of Array.isArray(pending) ? pending : []) {
    const target = item && byShortLink.get(item.shortLink);
    if (target && target !== item.cardId) {
      attach[item.cardId] = normalizeAttachedCardIds([...(attach[item.cardId] || []), target], item.cardId);
    } else if (item && item.cardId) {
      unresolved.push({ cardId: item.cardId, url: item.url });
    }
  }
  return { attach, unresolved };
}

// A WeKan import (models/wekanCreator.js) gives every card a new id; the
// attached cards that came in the same export follow theirs, and one that did
// not is dropped rather than left pointing at a card of the old installation.
function remapAttachedCardIds(ids, idMap, ownId) {
  return normalizeAttachedCardIds((Array.isArray(ids) ? ids : []).map(id => idMap && idMap[id]).filter(Boolean), ownId);
}

module.exports = {
  MAX_ATTACHED_CARDS,
  normalizeAttachedCardIds,
  attachedCardIdFrom,
  trelloCardShortLink,
  resolveTrelloCardAttachments,
  remapAttachedCardIds,
};
