'use strict';

// Pure helper: build the `meta` object stored on every card attachment
// (Attachments FilesCollection, ostrio:files). Kept side-effect free so it can
// be unit tested without a database or the Meteor client environment.
//
// This single builder is shared by ALL card attachment upload paths:
//   - the card Attachments popup and clipboard upload
//     (client/components/cards/attachments.js), and
//   - images uploaded inside card COMMENTS / the card description through the
//     rich text editor (client/components/main/editor.js, summernote
//     onImageUpload), via Utils.getCommonAttachmentMetaFrom().
//
// Because comment uploads carry the exact same `meta.cardId` as direct card
// uploads, they are listed in the card's Attachments section, whose queries
// all key on `meta.cardId` (Template.attachmentGallery in
// client/components/cards/attachments.js and Cards.helpers.attachments in
// models/cards.js) with no `meta.source` filtering. That is the behaviour
// requested in https://github.com/wekan/wekan/issues/3843 — an attachment
// added in a card comment must stay linked to (and visible in) the card's
// global attachment list.
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

module.exports = { buildCardAttachmentMeta };
