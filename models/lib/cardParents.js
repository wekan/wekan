'use strict';

// wekan/wekan#3626 (maintainer decision 2026-09-29): a card may be a subtask of
// SEVERAL parents - "A needs to be done before B and C can start, so A is a
// subtask of both".
//
// The model: `parentIds` holds every parent, and `parentId` stays the PRIMARY
// parent - always parentIds[0] - so everything that reads one parent (the
// path shown above a card, exports, the REST API, imports) keeps working. A
// card written before this has only `parentId`, which is its one parent.
//
// What changes for readers:
//   - a card's children are the cards with this card in parentId OR in
//     parentIds (childrenSelector);
//   - an ancestor walk that must see every ancestor (the cycle guard, the
//     board publication) follows all parents (collectAllAncestorIds);
//   - destructive cascades - archiving, restoring or deleting children with
//     their parent - take only the children this card is the one parent of;
//     a child with other parents just loses this one, so archiving C does not
//     archive A while A is still B's subtask (onlyChildrenSelector,
//     sharedChildrenSelector).
//
// Pure: callers pass the card lookups in.

const isId = value => typeof value === 'string' && value.length > 0;

// Every parent of a card, primary first, each once.
function cardParentIds(card) {
  if (!card) return [];
  const ids = [card.parentId, ...(Array.isArray(card.parentIds) ? card.parentIds : [])].filter(isId);
  return [...new Set(ids)];
}

// The fields that store `ids` (primary first): parentId is '' with no parent,
// matching the schema default.
function parentFields(ids) {
  const clean = [...new Set((Array.isArray(ids) ? ids : []).filter(isId))];
  return { parentId: clean[0] || '', parentIds: clean };
}

function withParentAdded(card, parentId) {
  return parentFields([...cardParentIds(card), parentId]);
}

function withParentRemoved(card, parentId) {
  return parentFields(cardParentIds(card).filter(id => id !== parentId));
}

// Selectors for "the children of this card".
function childrenSelector(cardId) {
  return { $or: [{ parentId: cardId }, { parentIds: cardId }] };
}
function primaryChildrenSelector(cardId) {
  return { parentId: cardId };
}
// Children that go WITH this card when it is archived, restored or deleted:
// only the ones it is the one parent of. A child with another parent too
// just loses this one (sharedChildrenSelector + withParentRemoved), so
// archiving C does not archive A while A is still B's subtask.
function onlyChildrenSelector(cardId) {
  return { parentId: cardId, 'parentIds.1': { $exists: false } };
}
function sharedChildrenSelector(cardId) {
  return { $or: [{ parentId: cardId }, { parentIds: cardId }], 'parentIds.1': { $exists: true } };
}

// { parentId: [subtasks] } with each subtask listed under EVERY parent.
function groupByParents(cards) {
  const map = {};
  for (const card of cards || []) {
    for (const id of cardParentIds(card)) (map[id] = map[id] || []).push(card);
  }
  return map;
}

// Every ancestor reachable from `seedIds` through ALL parents, each once;
// `parentsOf(ids)` returns the card documents for those ids (sync or async).
async function collectAllAncestorIds(seedIds, parentsOf) {
  const seen = new Set();
  let frontier = (Array.isArray(seedIds) ? seedIds : []).filter(id => isId(id) && !seen.has(id) && seen.add(id));
  while (frontier.length) {
    const docs = (await parentsOf(frontier)) || [];
    const next = [];
    for (const doc of docs) {
      for (const id of cardParentIds(doc)) {
        if (!seen.has(id)) {
          seen.add(id);
          next.push(id);
        }
      }
    }
    frontier = next;
  }
  return [...seen];
}

// The same walk for synchronous lookups (client minimongo).
function collectAllAncestorIdsSync(seedIds, getCard) {
  const seen = new Set();
  const stack = (Array.isArray(seedIds) ? seedIds : []).filter(isId);
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const parent of cardParentIds(getCard(id))) if (!seen.has(parent)) stack.push(parent);
  }
  return [...seen];
}

// #3328: would making `parentId` a parent of `cardId` close a loop? It does
// when the card is the proposed parent or any of that parent's ancestors.
function wouldCreateParentCycle(cardId, parentId, ancestorIdsOfParent) {
  if (!isId(cardId) || !isId(parentId)) return false;
  return parentId === cardId || (ancestorIdsOfParent || []).includes(cardId);
}

module.exports = {
  cardParentIds, parentFields, withParentAdded, withParentRemoved,
  childrenSelector, primaryChildrenSelector, onlyChildrenSelector, sharedChildrenSelector,
  collectAllAncestorIds, collectAllAncestorIdsSync, wouldCreateParentCycle, groupByParents,
};
