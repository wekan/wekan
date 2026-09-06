import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Attachments from '/models/attachments';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { tripCanary } from '/server/lib/canary';
import { attachmentKind } from '/models/lib/attachmentKind';
import { rename } from '/models/lib/fileStoreStrategy';
const { filenameLooksLikeExploit, sanitizeUploadFileName } = require('/models/lib/uploadFileName');

function refuseAttachment(userId, detail) {
  tripCanary('attachment.cross-scope', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function editableAttachment(userId, input = {}) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const attachment = await Attachments.collection.findOneAsync({
    _id: String(input.attachmentId || ''),
  });
  if (!attachment?.meta?.cardId || !attachment.meta.boardId) {
    refuseAttachment(userId, 'attachment was missing or had no card and board scope');
  }

  let contentCard = await Cards.findOneAsync({
    _id: attachment.meta.cardId, boardId: attachment.meta.boardId, deletedAt: null,
  });
  if (!contentCard || !(await canEditCardOrLinkedCard(userId, contentCard))) {
    refuseAttachment(userId, 'attachment content card did not grant write access');
  }

  const routeCardId = String(input.cardId || '');
  const routeBoardId = String(input.boardId || '');
  if (routeCardId || routeBoardId) {
    const routeCard = await Cards.findOneAsync({
      _id: routeCardId, boardId: routeBoardId, deletedAt: null,
    });
    if (!routeCard || !(await canEditCardOrLinkedCard(userId, routeCard))) {
      refuseAttachment(userId, 'submitted attachment route did not grant write access');
    }
    if (routeCard.type === 'cardType-linkedCard') {
      if (routeCard.linkedId !== contentCard._id) {
        refuseAttachment(userId, 'attachment did not belong to the submitted linked card');
      }
    } else if (routeCard._id !== contentCard._id || routeCard.boardId !== contentCard.boardId) {
      refuseAttachment(userId, 'attachment did not belong to the submitted route card');
    }
  }
  return { attachment, contentCard };
}

async function renameAccessibleAttachment(userId, input) {
  const { attachment } = await editableAttachment(userId, input);
  const proposed = String(input?.name || '').trim();
  if (!proposed || proposed.length > 1000 || filenameLooksLikeExploit(proposed)) {
    throw new Meteor.Error('invalid-attachment-name');
  }
  const safeName = sanitizeUploadFileName(proposed, attachmentKind(attachment).type || attachment.type);
  if (!safeName) throw new Meteor.Error('invalid-attachment-name');
  // Load the factory only at invocation time. attachments.server initializes it
  // before methods can run; avoiding a static cycle also keeps this boundary
  // usable from the early HTML4 request module.
  const { fileStoreStrategyFactory } = require('/models/attachments.server');
  rename(attachment, safeName, fileStoreStrategyFactory);
  return safeName;
}

async function removeAccessibleAttachment(userId, input) {
  const { attachment, contentCard } = await editableAttachment(userId, input);
  if (contentCard.coverId === attachment._id) {
    await Cards.updateAsync(
      { _id: contentCard._id, boardId: contentCard.boardId, coverId: attachment._id },
      { $unset: { coverId: '' } },
    );
  }
  await Attachments.removeAsync({
    _id: attachment._id,
    'meta.cardId': contentCard._id,
    'meta.boardId': contentCard.boardId,
  });
  return true;
}

async function setAccessibleAttachmentCover(userId, input) {
  const { attachment, contentCard } = await editableAttachment(userId, input);
  const enabled = input?.enabled;
  if (typeof enabled !== 'boolean') throw new Meteor.Error('invalid-cover-state');
  if (enabled && !attachmentKind(attachment).isImage) {
    throw new Meteor.Error('attachment-is-not-image');
  }
  if (enabled) {
    await Cards.updateAsync(
      { _id: contentCard._id, boardId: contentCard.boardId },
      { $set: { coverId: attachment._id } },
    );
  } else {
    await Cards.updateAsync(
      { _id: contentCard._id, boardId: contentCard.boardId, coverId: attachment._id },
      { $unset: { coverId: '' } },
    );
  }
  return true;
}

Meteor.methods({
  async renameAttachment(attachmentId, name) {
    check(attachmentId, String);
    check(name, String);
    return renameAccessibleAttachment(this.userId, { attachmentId, name });
  },
  async removeAttachment(attachmentId) {
    check(attachmentId, String);
    return removeAccessibleAttachment(this.userId, { attachmentId });
  },
  async setAttachmentCover(attachmentId, enabled) {
    check(attachmentId, String);
    check(enabled, Boolean);
    return setAccessibleAttachmentCover(this.userId, { attachmentId, enabled });
  },
});

export {
  editableAttachment,
  removeAccessibleAttachment,
  renameAccessibleAttachment,
  setAccessibleAttachmentCover,
};
