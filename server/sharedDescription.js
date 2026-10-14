// #140: real-time shared editing of card descriptions
// (models/lib/sharedDescription.js). The server keeps one Yjs document per
// card being edited, merges each editor's update into it, and publishes the
// merged state to whoever may edit that card. Saving still writes
// card.description exactly as before; the shared document only carries the
// unsaved typing between the editors.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import * as Y from 'yjs';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

const {
  MAX_UPDATE_BYTES, MAX_STATE_BYTES, isStale, bytesToBase64, base64ToBytes,
} = require('/models/lib/sharedDescription');

// { _id: cardId, boardId, state (base64 Yjs update), generation, updatedAt }.
// Clients write only through the method below. `generation` changes whenever
// the document is started again: an editor merging the old one into the new
// would duplicate the text, so it starts over instead.
export const CardDescriptionDocs = new Mongo.Collection('cardDescriptionDocs');
CardDescriptionDocs.deny({ insert: () => true, update: () => true, remove: () => true });

async function editableCard(userId, cardId) {
  if (!userId) return null;
  const card = await Cards.findOneAsync(cardId);
  if (!card || !(await canEditCardOrLinkedCard(userId, card, null, { recordDenial: false }))) return null;
  return card;
}

function docFromDescription(description) {
  const ydoc = new Y.Doc();
  ydoc.getText('description').insert(0, String(description || ''));
  return ydoc;
}

// The current shared document, started from the saved description when there
// is none, or when the one there was left idle.
async function currentDoc(card) {
  const existing = await CardDescriptionDocs.findOneAsync(card._id);
  if (existing && !isStale(existing)) {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, base64ToBytes(existing.state));
    return { ydoc, generation: existing.generation, state: existing.state };
  }
  const ydoc = docFromDescription(card.description);
  const generation = Random.id();
  await CardDescriptionDocs.upsertAsync(card._id, { $set: {
    boardId: card.boardId, state: bytesToBase64(Y.encodeStateAsUpdate(ydoc)), generation, updatedAt: new Date(),
  } });
  return { ydoc, generation, state: null };
}

// The shared document, only to a subscriber who may edit the card: it holds
// typing that is not saved yet.
Meteor.publish('cardDescriptionDoc', async function (cardId) {
  check(cardId, String);
  const card = await editableCard(this.userId, cardId);
  if (!card) return this.ready();
  await currentDoc(card);
  return CardDescriptionDocs.find({ _id: cardId }, { fields: { state: 1, generation: 1, updatedAt: 1 } });
});

Meteor.methods({
  async applyCardDescriptionUpdate(cardId, generation, update) {
    check(cardId, String);
    check(generation, String);
    check(update, String);
    if (update.length > Math.ceil(MAX_UPDATE_BYTES / 3) * 4) throw new Meteor.Error('description-update-too-large');
    const card = await editableCard(this.userId, cardId);
    if (!card) throw new Meteor.Error('not-authorized');
    let bytes;
    try {
      bytes = base64ToBytes(update);
    } catch (e) {
      throw new Meteor.Error('description-update-invalid');
    }
    // Two editors' updates can arrive together: the write is conditional on
    // the state it merged into, and the merge is redone when it lost. Yjs
    // updates commute, so redoing it is always correct.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { ydoc, generation: current, state: before } = await currentDoc(card);
      if (generation !== current) throw new Meteor.Error('description-doc-reset');
      try {
        Y.applyUpdate(ydoc, bytes);
      } catch (e) {
        throw new Meteor.Error('description-update-invalid');
      }
      const state = Y.encodeStateAsUpdate(ydoc);
      if (state.length > MAX_STATE_BYTES) throw new Meteor.Error('description-update-too-large');
      const selector = before === null ? { _id: cardId, generation } : { _id: cardId, generation, state: before };
      const changed = await CardDescriptionDocs.updateAsync(selector, { $set: { state: bytesToBase64(state), updatedAt: new Date() } });
      if (changed) return true;
    }
    throw new Meteor.Error('description-update-busy');
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'applyCardDescriptionUpdate', connectionId: () => true }, 100, 10000);

// A description changed some other way than by this document - an API call, a
// rule, an import, another card's save that differs - makes the document
// stale; it is started again from the new text. A save of the shared text
// itself keeps it, so the others go on editing without a jump.
Cards.after.update(function (userId, doc, fieldNames) {
  if (!fieldNames || !fieldNames.includes('description')) return;
  Meteor.defer(async () => {
    try {
      const existing = await CardDescriptionDocs.findOneAsync(doc._id);
      if (!existing) return;
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, base64ToBytes(existing.state));
      if (ydoc.getText('description').toString() !== String(doc.description || '')) {
        await CardDescriptionDocs.removeAsync(doc._id);
      }
    } catch (e) {
      // the shared document is a convenience; the saved description is the record
    }
  });
});

Cards.after.remove(function (userId, doc) {
  Meteor.defer(() => CardDescriptionDocs.removeAsync(doc._id).catch(() => {}));
});
