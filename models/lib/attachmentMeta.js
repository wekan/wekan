'use strict';

// Pure helper: build the `meta` object stored on every card attachment
// (Attachments FilesCollection, ostrio:files). Kept side-effect free so it can
// be unit tested without a database or the Meteor client environment.
//
// Shared by the card Attachments popup and clipboard upload through
// Utils.getCommonAttachmentMetaFrom(). Existing attachments referenced in
// comments remain visible in the gallery through meta.cardId, without any
// meta.source filtering (#3843).
//
// For a linked card the attachment is attached to the REAL card (linkedId),
// so it shows up on the original card and on every linked copy.
//
// `getCardById` resolves the real card of a linked card (the client passes
// ReactiveCache.getCard). A missing/null card yields an empty meta rather
// than throwing, so a failed lookup cannot crash an upload handler.
function buildCardAttachmentMeta(card, getCardById) {
  const meta = {};
  if (!card) {
    return meta;
  }
  if (typeof card.isLinkedCard === 'function' && card.isLinkedCard()) {
    const realCard =
      typeof getCardById === 'function' ? getCardById(card.linkedId) : null;
    if (realCard) {
      meta.boardId = realCard.boardId;
    }
    meta.cardId = card.linkedId;
  } else {
    meta.boardId = card.boardId;
    meta.swimlaneId = card.swimlaneId;
    meta.listId = card.listId;
    meta.cardId = card._id;
  }
  return meta;
}

export { buildCardAttachmentMeta };
