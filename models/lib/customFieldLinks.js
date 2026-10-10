'use strict';
// #5681: linked custom fields - "link Board1/Card1/Operation with
// Board2/Card1/Operation so these transfer the information to each other".
//
// A card can be linked to another card, on the same or another board, for its
// custom fields. Each link is stored on BOTH cards (`customFieldLinks`), as
// { cardId, mode, userId, createdAt }:
//
//   - 'both'    on both cards: a change on either card is copied to the other;
//   - 'send'    on the card whose changes flow to the other (the "main") card,
//     'receive' on that main card: one way only.
//
// Fields are matched by NAME (trimmed, case-insensitive) and a compatible TYPE.
// A field with no counterpart on the other card is left alone, so a "Remarks"
// field that only the main card has stays the main card's own.
//
// The server (server/models/customFieldLinks.js) decides who may link and
// whether a link is still allowed to write; this file is the pure planning it
// uses: which fields match, what value each one gets, and when a chain of
// links has to stop. Pure, isomorphic and dependency-free apart from the
// card-URL parser: tests/customFieldLinks.test.cjs.
const { findCardUrlMatches } = require('./cardUrlAutolink');

// A card keeps at most this many field links. Every value change on a linked
// card reads each linked card, so the cap bounds that work per change.
const MAX_FIELD_LINKS = 20;
// A change travels along at most this many links in a row (A -> B -> C ...).
const MAX_CHAIN_DEPTH = 5;
// ...and makes at most this many propagated card writes in total.
const MAX_PROPAGATION_WRITES = 50;

const LINK_MODES = ['both', 'send', 'receive'];
// What the user picks when linking: 'both' or 'send' (this card -> main card).
const CHOOSABLE_MODES = ['both', 'send'];
const ID = /^[A-Za-z0-9_-]{1,64}$/;

// The mode stored on the OTHER card of a link.
function mirrorMode(mode) {
  if (mode === 'send') return 'receive';
  if (mode === 'receive') return 'send';
  return 'both';
}
// Does a change on the card holding this link flow to link.cardId?
function sendsAlong(link) {
  return !!link && (link.mode === 'both' || link.mode === 'send');
}
// Does a change on link.cardId flow to the card holding this link?
function receivesAlong(link) {
  return !!link && (link.mode === 'both' || link.mode === 'receive');
}

// The stored links of one card: well-formed, one per other card, never the
// card itself, at most MAX_FIELD_LINKS.
function normalizeFieldLinks(links, ownId) {
  const out = [];
  for (const link of Array.isArray(links) ? links : []) {
    if (!link || typeof link !== 'object') continue;
    const { cardId, mode, userId } = link;
    if (typeof cardId !== 'string' || !ID.test(cardId) || cardId === ownId) continue;
    if (!LINK_MODES.includes(mode) || typeof userId !== 'string' || !userId) continue;
    if (out.some(other => other.cardId === cardId)) continue;
    out.push({ cardId, mode, userId, ...(link.createdAt ? { createdAt: link.createdAt } : {}) });
    if (out.length >= MAX_FIELD_LINKS) break;
  }
  return out;
}

// A link is live only when the other card holds the mirror of it, made by the
// same person. A one-sided entry - a forged write, a card copied with its
// links, a half-finished removal - never moves a value.
function isMirrored(link, otherCard, ownId) {
  if (!link || !otherCard) return false;
  const back = normalizeFieldLinks(otherCard.customFieldLinks, otherCard._id)
    .find(other => other.cardId === ownId);
  return !!back && back.mode === mirrorMode(link.mode) && back.userId === link.userId;
}

// What the user typed or pasted to name the other card: a WeKan card link (as
// Copy card link gives it) or a bare card id. Returns the card id, or null.
function fieldLinkTargetId(input) {
  const text = String(input == null ? '' : input).trim();
  if (!text) return null;
  const [found] = findCardUrlMatches(text);
  if (found && found.cardId && ID.test(found.cardId)) return found.cardId;
  return ID.test(text) ? text : null;
}

function normalizeFieldName(name) {
  return String(name == null ? '' : name).trim().replace(/\s+/g, ' ').toLowerCase();
}

// Two field definitions can carry each other's values when they have the same
// type; a currency only into the same currency, a number of euros is not a
// number of dollars.
function fieldsCompatible(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'currency') {
    return ((a.settings && a.settings.currencyCode) || '') === ((b.settings && b.settings.currencyCode) || '');
  }
  return true;
}

// An admin-only field (#3141) never takes part, on either side: its value is
// hidden from ordinary members, so copying it out would show it to them, and
// copying into it from a readable field would let a non-admin set it.
function linkableField(definition) {
  return !!definition && typeof definition._id === 'string' && !definition.adminOnly &&
    !!normalizeFieldName(definition.name);
}

// The fields of two cards that link: [{ source, target, name }] with each
// definition. A name used by two fields on the same card is ambiguous and is
// skipped rather than guessed.
function matchLinkedFields(sourceDefinitions, targetDefinitions) {
  const byName = defs => {
    const map = new Map();
    for (const def of Array.isArray(defs) ? defs : []) {
      if (!linkableField(def)) continue;
      const key = normalizeFieldName(def.name);
      map.set(key, map.has(key) ? null : def);
    }
    return map;
  };
  const sources = byName(sourceDefinitions);
  const targets = byName(targetDefinitions);
  const pairs = [];
  for (const [key, source] of sources) {
    const target = targets.get(key);
    if (!source || !target || !fieldsCompatible(source, target)) continue;
    pairs.push({ source, target, name: target.name });
  }
  return pairs;
}

const isEmpty = value => value === null || value === undefined || value === '' ||
  (Array.isArray(value) && value.length === 0);

function valuesEqual(a, b) {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
      a.every((item, i) => valuesEqual(item, b[i]));
  }
  return a === b;
}

// A dropdown value is the id of one of its items. The other card's field has
// its own items, so the value goes over by the item's NAME.
function dropdownItemFor(itemId, sourceDef, targetDef) {
  const items = def => (def && def.settings && Array.isArray(def.settings.dropdownItems)
    ? def.settings.dropdownItems : []);
  const item = items(sourceDef).find(entry => entry && entry._id === itemId);
  if (!item) return null;
  const name = normalizeFieldName(item.name);
  const matches = items(targetDef).filter(entry => entry && normalizeFieldName(entry.name) === name);
  return matches.length === 1 ? matches[0]._id : null;
}

// The value one field gives its counterpart: { ok: true, value } or
// { ok: false } when it cannot be carried over. A dropdown item the other
// field does not have is not carried at all - writing a partial value would,
// on a two-way link, then come back and erase the original.
function mapLinkedValue(value, sourceDef, targetDef) {
  if (!fieldsCompatible(sourceDef, targetDef)) return { ok: false };
  if (isEmpty(value)) return { ok: true, value: null };
  if (sourceDef.type === 'dropdown') {
    const id = dropdownItemFor(value, sourceDef, targetDef);
    return id ? { ok: true, value: id } : { ok: false };
  }
  if (sourceDef.type === 'dropdownMultiSelect') {
    if (!Array.isArray(value)) return { ok: false };
    const ids = value.map(id => dropdownItemFor(id, sourceDef, targetDef));
    return ids.every(Boolean) ? { ok: true, value: ids } : { ok: false };
  }
  if (Array.isArray(value)) return { ok: true, value: value.slice() };
  if (value instanceof Date) return { ok: true, value: new Date(value.getTime()) };
  return { ok: true, value };
}

// The custom fields of a card whose value changed between two versions of
// it. A field taken off the card is not a change to carry over.
function changedCustomFieldIds(previousFields, currentFields) {
  const before = new Map((Array.isArray(previousFields) ? previousFields : [])
    .filter(field => field && typeof field._id === 'string').map(field => [field._id, field.value]));
  const out = [];
  for (const field of Array.isArray(currentFields) ? currentFields : []) {
    if (!field || typeof field._id !== 'string' || out.includes(field._id)) continue;
    const old = before.has(field._id) ? before.get(field._id) : null;
    if (!valuesEqual(old, field.value)) out.push(field._id);
  }
  return out;
}

// The writes one change makes on the linked card: [{ index, fieldId, value,
// name }], `index` being the position in targetCard.customFields.
//   definitions      Map (or object) of field id -> definition, for both cards
//   changedFieldIds  the source fields that changed; null means all of them
//   mayWriteTarget   (definition) -> may this link write that field (read-only)
//   onlyIntoEmpty    fill only fields the target has no value in (on linking)
// Only fields on BOTH cards take part, and only when the value differs.
function planLinkedFieldWrites({ sourceCard, targetCard, definitions, changedFieldIds = null,
  mayWriteTarget = () => true, onlyIntoEmpty = false }) {
  if (!sourceCard || !targetCard) return [];
  const get = id => (definitions instanceof Map ? definitions.get(id) : definitions && definitions[id]);
  const onBoard = (def, card) => def && (!Array.isArray(def.boardIds) || def.boardIds.includes(card.boardId));
  const fieldsOf = card => (Array.isArray(card.customFields) ? card.customFields : [])
    .filter(field => field && typeof field._id === 'string');
  const sourceFields = fieldsOf(sourceCard);
  const targetFields = fieldsOf(targetCard);
  const sourceDefs = sourceFields.map(field => get(field._id)).filter(def => onBoard(def, sourceCard));
  const targetDefs = targetFields.map(field => get(field._id)).filter(def => onBoard(def, targetCard));
  const changed = Array.isArray(changedFieldIds) ? new Set(changedFieldIds) : null;
  const writes = [];
  for (const { source, target, name } of matchLinkedFields(sourceDefs, targetDefs)) {
    if (changed && !changed.has(source._id)) continue;
    if (!mayWriteTarget(target)) continue;
    const index = targetCard.customFields.findIndex(field => field && field._id === target._id);
    if (index < 0) continue;
    const from = sourceFields.find(field => field._id === source._id);
    const current = targetCard.customFields[index].value;
    if (onlyIntoEmpty && (!isEmpty(current) || isEmpty(from.value))) continue;
    const mapped = mapLinkedValue(from.value, source, target);
    if (!mapped.ok || valuesEqual(mapped.value, current)) continue;
    writes.push({ index, fieldId: target._id, value: mapped.value, name });
  }
  return writes;
}

// The chain a change travels along. Each propagated write runs with the chain
// that led to it: the cards already written to and a write budget shared by
// the whole change. A card already on the chain is never written again - that
// is what stops a two-way link from bouncing a value back (A -> B -> A) and a
// ring of links (A -> B -> C -> A) from going round.
function newPropagationChain(originCardId) {
  return { visited: [originCardId], depth: 0, budget: { writes: 0 } };
}
function chainStep(chain, fromCardId, targetCardId) {
  const current = chain || newPropagationChain(fromCardId);
  const visited = current.visited.includes(fromCardId) ? current.visited : [...current.visited, fromCardId];
  if (visited.includes(targetCardId)) return { ok: false, reason: 'loop' };
  if (current.depth >= MAX_CHAIN_DEPTH) return { ok: false, reason: 'depth' };
  if (current.budget.writes >= MAX_PROPAGATION_WRITES) return { ok: false, reason: 'budget' };
  return { ok: true, chain: { visited: [...visited, targetCardId], depth: current.depth + 1, budget: current.budget } };
}

module.exports = {
  MAX_FIELD_LINKS,
  MAX_CHAIN_DEPTH,
  MAX_PROPAGATION_WRITES,
  LINK_MODES,
  CHOOSABLE_MODES,
  mirrorMode,
  sendsAlong,
  receivesAlong,
  normalizeFieldLinks,
  isMirrored,
  fieldLinkTargetId,
  normalizeFieldName,
  fieldsCompatible,
  linkableField,
  matchLinkedFields,
  valuesEqual,
  mapLinkedValue,
  changedCustomFieldIds,
  planLinkedFieldWrites,
  newPropagationChain,
  chainStep,
};
