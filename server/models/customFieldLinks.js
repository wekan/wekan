// #5681: linked custom fields. A card's custom fields can be linked to another
// card's, on the same or another board; a change to a linked field is copied
// to the field of the same name on the other card (models/lib/customFieldLinks.js
// has the matching and the planning, and says how the link is stored).
//
// Who may do what:
//   - link or unlink two cards: whoever may EDIT both of them
//     (canEditCardOrLinkedCard) and READ both (the board's read rule and, on an
//     assigned-only board, a card assigned to them). A card they cannot read is
//     "not found", the same as one that does not exist.
//   - a change propagates only while the person who MADE the link can still
//     edit and read both cards. Losing access to either card stops that link
//     from writing; it starts again if the access comes back. The write is made
//     as that person (like a rule action runs as its user, server/rulesHelper.js
//     withUserId), so the ordinary card hooks record it in Activities and
//     History under their name, and the custom-field write guard
//     (server/adminOnlyFieldWrites.js) checks it with their rights.
//   - an admin-only field (#3141) never takes part on either side, and a
//     read-only field (#3143) is written only when the link's creator could
//     write it by hand.
//   - an archived card neither sends nor receives.
//
// Every write path that changes a value goes through Cards.after.update below:
// the card form, the custom-field methods, rules, imports into an existing
// card. The legacy REST handlers write with `.direct`, which skips hooks, so
// they call propagateLinkedCustomFields themselves (server/models/cards.js).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDP } from 'meteor/ddp';
import { AsyncLocalStorage } from 'node:async_hooks';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import CustomFields from '/models/customFields';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canReadBoard } from '/models/lib/boardVisibility';
import { buildCardRelativeUrl } from '/models/lib/cardUrl';
import { tripCanaryDeny } from '/server/lib/canary';
const { collectionWriteSucceeded } = require('/server/lib/collectionWriteOutcome');
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { mayWriteField } = require('/models/lib/adminOnlyCustomFields');
const {
  MAX_FIELD_LINKS, CHOOSABLE_MODES, mirrorMode, sendsAlong, normalizeFieldLinks, isMirrored,
  fieldLinkTargetId, matchLinkedFields, changedCustomFieldIds, planLinkedFieldWrites, chainStep, newPropagationChain,
} = require('/models/lib/customFieldLinks');

const notAuthorized = () => new Meteor.Error('not-authorized', 'Not authorized');
const notFound = () => new Meteor.Error('field-link-not-found', 'Card not found');

// The chain the current propagated write belongs to (models/lib chainStep).
// AsyncLocalStorage, not a module flag: the server handles many requests at
// once, and the store follows only the awaits of the change that opened it.
const chainStore = new AsyncLocalStorage();

async function canReadCard(userId, card, board) {
  if (!card || !board || !canReadBoard(userId, board)) return false;
  if (!assignedOnlyCardScope(board, userId)) return true;
  return Array.isArray(card.assignees) && card.assignees.includes(userId);
}

// May this user both read and edit this card? `recordDenial` off: this is a
// question asked on every propagation, not an attempt to be logged.
async function canReadAndEdit(userId, card) {
  if (!userId || !card) return false;
  const board = await Boards.findOneAsync(card.boardId);
  return !!board && await canReadCard(userId, card, board) &&
    await canEditCardOrLinkedCard(userId, card, board, { recordDenial: false });
}

// A linked-card placeholder (cardType-linkedCard) shows another card; its
// custom fields are that card's, so the link is made on that card.
async function realCard(cardId) {
  const card = await Cards.findOneAsync({ _id: cardId });
  if (card && card.type === 'cardType-linkedCard' && card.linkedId) {
    return Cards.findOneAsync({ _id: card.linkedId });
  }
  return card;
}

// Run `fn` as `userId`: the collection hooks, the History recorder and the
// custom-field write guard all read the user from the method invocation.
function asUser(userId, fn) {
  if (userId && typeof DDP._CurrentMethodInvocation?.withValue === 'function') {
    return DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn);
  }
  return fn();
}

async function definitionsFor(...cards) {
  const ids = [...new Set(cards.flatMap(card => (card.customFields || [])
    .filter(field => field && typeof field._id === 'string').map(field => field._id)))];
  if (!ids.length) return new Map();
  const defs = await CustomFields.find({ _id: { $in: ids } }).fetchAsync();
  return new Map(defs.map(def => [def._id, def]));
}

async function adminBoardsOf(userId) {
  const boards = await Boards.find(
    { members: { $elemMatch: { userId, isActive: true, isAdmin: true } } }, { fields: { _id: 1 } },
  ).fetchAsync();
  return new Set(boards.map(board => board._id));
}

// Write one planned set of values into the target card, as `userId`, inside
// the chain that led here so the target's own hook continues it - or stops it.
async function writePlanned(target, writes, userId, chain) {
  if (!writes.length) return 0;
  const $set = {};
  for (const write of writes) $set[`customFields.${write.index}.value`] = write.value;
  chain.budget.writes += 1;
  return chainStore.run(chain, () => asUser(userId, () => Cards.updateAsync({ _id: target._id }, { $set })));
}

// Carry the changed custom fields of `card` to the cards it sends to.
// `previousCustomFields` is the card's customFields before the change.
// Never throws: a link that cannot write must not fail the edit that caused it.
export async function propagateLinkedCustomFields(card, previousCustomFields) {
  if (!card || card.archived) return;
  const links = normalizeFieldLinks(card.customFieldLinks, card._id).filter(sendsAlong);
  if (!links.length) return;
  const changed = changedCustomFieldIds(previousCustomFields, card.customFields);
  if (!changed.length) return;
  // One chain, and one write budget, for everything this change sets off.
  const chain = chainStore.getStore() || newPropagationChain(card._id);
  for (const link of links) {
    try {
      const step = chainStep(chain, card._id, link.cardId);
      if (!step.ok) continue;
      const target = await Cards.findOneAsync({ _id: link.cardId });
      if (!target || target.archived || !isMirrored(link, target, card._id)) continue;
      // The link writes only while its creator may still edit and read both.
      if (!(await canReadAndEdit(link.userId, card)) || !(await canReadAndEdit(link.userId, target))) continue;
      const definitions = await definitionsFor(card, target);
      const adminBoards = await adminBoardsOf(link.userId);
      const writes = planLinkedFieldWrites({
        sourceCard: card, targetCard: target, definitions, changedFieldIds: changed,
        mayWriteTarget: def => mayWriteField(def, target.boardId, adminBoards),
      });
      await writePlanned(target, writes, link.userId, step.chain);
    } catch (error) {
      // One link that cannot write must not stop the others.
      console.warn('customFieldLinks: propagation failed:', error && (error.reason || error.message));
    }
  }
}

Cards.after.update(async function (userId, doc, fieldNames) {
  if (!fieldNames.includes('customFields') || !collectionWriteSucceeded(this)) return;
  if (!doc.customFieldLinks || !doc.customFieldLinks.length) return;
  await propagateLinkedCustomFields(doc, (this.previous || {}).customFields);
});

// Links are made by the methods below, on both cards at once, never by a
// client collection write. A client that writes the field anyway is trying to
// link a card it could not link through the method.
Cards.deny({
  update(userId, doc, fieldNames) {
    if (fieldNames.includes('customFieldLinks')) return tripCanaryDeny('card.field-link-direct', { userId });
    return false;
  },
  fetch: [],
});

// A new card - a copy, an import, a restore - starts with no links: a link is
// two-sided and the other card does not name this one.
Cards.before.insert((userId, doc) => {
  if (doc && Object.hasOwn(doc, 'customFieldLinks')) delete doc.customFieldLinks;
});

// A deleted card leaves no link behind on the cards it was linked to.
Cards.before.remove(async (userId, doc) => {
  const ids = normalizeFieldLinks(doc && doc.customFieldLinks, doc && doc._id).map(link => link.cardId);
  if (!ids.length) return;
  await Cards.direct.updateAsync({ _id: { $in: ids } },
    { $pull: { customFieldLinks: { cardId: doc._id } } }, { multi: true });
});

async function editableCard(userId, cardId) {
  const card = await realCard(cardId);
  if (!card || !(await canReadAndEdit(userId, card))) throw notAuthorized();
  return card;
}

async function linkInfo(viewerId, card, link) {
  const other = await Cards.findOneAsync({ _id: link.cardId });
  const board = other && await Boards.findOneAsync(other.boardId);
  if (!other || !(await canReadCard(viewerId, other, board))) {
    return { cardId: link.cardId, mode: link.mode, unavailable: true };
  }
  const list = other.listId ? await Lists.findOneAsync({ _id: other.listId }, { fields: { title: 1 } }) : null;
  const definitions = await definitionsFor(card, other);
  const defsOn = c => (c.customFields || []).map(field => field && definitions.get(field._id))
    .filter(def => def && (def.boardIds || []).includes(c.boardId));
  const mirrored = isMirrored(link, other, card._id);
  const active = mirrored && !card.archived && !other.archived &&
    await canReadAndEdit(link.userId, card) && await canReadAndEdit(link.userId, other);
  return {
    cardId: other._id,
    mode: link.mode,
    title: other.title || '',
    boardTitle: board.title || '',
    listTitle: (list && list.title) || '',
    url: buildCardRelativeUrl(other, board),
    archived: other.archived === true,
    mirrored,
    active,
    fields: matchLinkedFields(defsOn(card), defsOn(other)).map(pair => pair.name),
  };
}

Meteor.methods({
  // Link the custom fields of `cardId` to `target` (a WeKan card link or a card
  // id). `mode`: 'both' - changes go both ways; 'send' - changes on this card
  // go to `target`, the main card.
  async linkCardCustomFields(cardId, target, mode) {
    check(cardId, String);
    check(target, String);
    check(mode, Match.Where(value => CHOOSABLE_MODES.includes(value)));
    if (!this.userId) throw notAuthorized();
    const card = await editableCard(this.userId, cardId);
    const targetId = fieldLinkTargetId(target);
    if (!targetId) throw new Meteor.Error('field-link-invalid', 'Not a card link');
    const other = await realCard(targetId);
    if (other && other._id === card._id) throw new Meteor.Error('field-link-self', 'A card cannot be linked to itself');
    const otherBoard = other && await Boards.findOneAsync(other.boardId);
    if (!other || !(await canReadCard(this.userId, other, otherBoard))) throw notFound();
    if (!(await canEditCardOrLinkedCard(this.userId, other, otherBoard))) throw notAuthorized();
    if (card.archived || other.archived) throw new Meteor.Error('field-link-archived', 'Archived card');

    const without = (c, id) => normalizeFieldLinks(c.customFieldLinks, c._id).filter(link => link.cardId !== id);
    const mine = without(card, other._id);
    const theirs = without(other, card._id);
    if (mine.length >= MAX_FIELD_LINKS || theirs.length >= MAX_FIELD_LINKS) {
      throw new Meteor.Error('field-link-limit', 'Too many linked cards');
    }
    const createdAt = new Date();
    const link = { cardId: other._id, mode, userId: this.userId, createdAt };
    await Cards.direct.updateAsync({ _id: card._id }, { $set: { customFieldLinks: [...mine, link] } });
    await Cards.direct.updateAsync({ _id: other._id }, { $set: { customFieldLinks: [...theirs,
      { cardId: card._id, mode: mirrorMode(mode), userId: this.userId, createdAt }] } });

    // Fill, once, the matching fields the receiving card has no value in yet.
    // Values already there are kept: linking never overwrites.
    const fill = async (from, to) => {
      const fresh = await Cards.findOneAsync({ _id: to._id });
      const definitions = await definitionsFor(from, fresh);
      const adminBoards = await adminBoardsOf(this.userId);
      const writes = planLinkedFieldWrites({ sourceCard: from, targetCard: fresh, definitions, onlyIntoEmpty: true,
        mayWriteTarget: def => mayWriteField(def, fresh.boardId, adminBoards) });
      const step = chainStep(null, from._id, to._id);
      try { await writePlanned(fresh, writes, this.userId, step.chain); }
      catch (error) { console.warn('customFieldLinks: initial fill failed:', error && (error.reason || error.message)); }
    };
    await fill(card, other);
    if (mode === 'both') await fill(await Cards.findOneAsync({ _id: other._id }), card);
    return linkInfo(this.userId, await Cards.findOneAsync({ _id: card._id }), link);
  },

  // Remove the link between `cardId` and `otherCardId`, from both cards. Needs
  // edit rights on both - unless the other card is gone, or does not hold its
  // side of the link, when there is nothing of it left to protect.
  async unlinkCardCustomFields(cardId, otherCardId) {
    check(cardId, String);
    check(otherCardId, String);
    if (!this.userId) throw notAuthorized();
    const card = await editableCard(this.userId, cardId);
    const link = normalizeFieldLinks(card.customFieldLinks, card._id).find(entry => entry.cardId === otherCardId);
    const other = await Cards.findOneAsync({ _id: otherCardId });
    const otherEditable = !!other && await canReadAndEdit(this.userId, other);
    if (other && link && isMirrored(link, other, card._id) && !otherEditable) throw notAuthorized();
    await Cards.direct.updateAsync({ _id: card._id }, { $pull: { customFieldLinks: { cardId: otherCardId } } });
    if (other && otherEditable) {
      await Cards.direct.updateAsync({ _id: other._id }, { $pull: { customFieldLinks: { cardId: card._id } } });
    }
    return true;
  },

  // The links of a card the viewer can read: [{ cardId, mode, title, boardTitle,
  // listTitle, url, archived, mirrored, active, fields }] - `fields` being the
  // names that match on both cards - or { cardId, mode, unavailable: true } for
  // a linked card the viewer cannot read, or that is gone.
  async cardCustomFieldLinksInfo(cardId) {
    check(cardId, String);
    const card = await realCard(cardId);
    const board = card && await Boards.findOneAsync(card.boardId);
    if (!card || !(await canReadCard(this.userId, card, board))) throw notAuthorized();
    const out = [];
    for (const link of normalizeFieldLinks(card.customFieldLinks, card._id)) {
      out.push(await linkInfo(this.userId, card, link));
    }
    return out;
  },
});
