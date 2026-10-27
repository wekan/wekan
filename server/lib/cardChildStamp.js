import Cards from '/models/cards';
import Checklists from '/models/checklists';

// StampBleed (#6813 review): checklists, checklist items and text notes carry a
// denormalized boardId - the board publication publishes them by it - and items
// a checklistId, by which a checklist draws them. The insert allow rules check
// write access on the document's CARD only, and the server's insert hooks kept
// a boardId the client sent. So a member of any board could insert, on their
// own card, a document stamped with a private board's id - published to that
// board's members - and an item with a checklistId of that board's checklist,
// drawn inside it: a write into a board they are not a member of.
//
// The server now takes boardId from the card always (server/models/
// checklists.js, checklistItems.js, models/cardTextNotes.js), and this deny
// refuses the forged insert outright and records it: WeKan's own client sends
// no boardId for checklists and items and the card's own for a text note, and
// an item always with its checklist's card - so a mismatch is an attempt, not
// ordinary use. Returns true to DENY.
export async function denyForgedCardChildInsert(doc, { source, checklist = false } = {}) {
  if (!doc || typeof doc.cardId !== 'string' || !doc.cardId) return false; // the allow rule refuses
  const card = await Cards.findOneAsync(doc.cardId, { fields: { boardId: 1 } });
  if (!card) return false; // the allow rule refuses
  let reason = '';
  if (typeof doc.boardId === 'string' && doc.boardId && doc.boardId !== card.boardId) {
    reason = 'a boardId that is not its card\'s board';
  } else if (checklist) {
    const parent = typeof doc.checklistId === 'string' && doc.checklistId
      ? await Checklists.findOneAsync(doc.checklistId, { fields: { cardId: 1 } })
      : null;
    if (!parent || parent.cardId !== doc.cardId) reason = 'a checklistId of another card\'s checklist';
  }
  if (!reason) return false;
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.card-child-stamp', action: 'blocked', source,
      detail: `Client inserted a document on its own card with ${reason}.`,
    });
  } catch (e) { /* logging must never break the guard */ }
  return true;
}

// StampBleed, attachments: a direct collection insert (/attachments/insert)
// is asked by the allow rule for its CARD (meta.cardId) and never looked at
// meta.boardId, by which the board publication publishes attachments. No
// WeKan client inserts there - uploads go through the upload pipeline, which
// models/attachments.server.js authorizes - so a mismatch is an attempt.
// Returns true to DENY.
export async function denyForgedAttachmentInsert(fileObj, { source } = {}) {
  const meta = fileObj && fileObj.meta;
  if (!meta || typeof meta.cardId !== 'string' || !meta.cardId) return false; // the allow rule decides
  const card = await Cards.findOneAsync(meta.cardId, { fields: { boardId: 1 } });
  if (!card) return false;
  if (typeof meta.boardId !== 'string' || !meta.boardId || meta.boardId === card.boardId) return false;
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.card-child-stamp', action: 'blocked', source,
      detail: 'Client inserted an attachment on its own card with a boardId that is not its card\'s board.',
    });
  } catch (e) { /* logging must never break the guard */ }
  return true;
}
