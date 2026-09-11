import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Attachments from '/models/attachments';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import ChangeHistory from '/models/changeHistory';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { deleteActivityUserId } from '/server/lib/attachmentActivityActor';
import { isRecordingSuppressed } from '/server/lib/historyRecordingScope';
import {
  softDeleteAttachmentPlan,
  restoreAttachmentPlan,
} from '/models/lib/attachmentSoftDelete';

// Attachment soft delete and restore (History.md §12). "Delete" on an
// attachment marks it - deletedAt / deletedBy / deleteBatchId, the same fields
// and helpers lists use - and keeps the file. The card, the minicard badge and
// every other card-facing read filter it out; the card history shows who
// deleted it and restores it. Nothing here ever calls Attachments.removeAsync:
// the one hard delete of attachments is the archived-board purge
// (server/models/boards.js boardRemover, §12.4).

// Who may delete or restore an attachment: whoever may edit the card it is on
// (the same check the upload allow rule uses, linked cards included), or for
// a board-level attachment such as a background, a member with write access.
export async function canSoftDeleteAttachment(userId, attachment) {
  if (!userId || !attachment) return false;
  const cardId = attachment.meta?.cardId;
  if (cardId) {
    const card = await Cards.findOneAsync(cardId);
    if (card) return await canEditCardOrLinkedCard(userId, card);
  }
  const board = await Boards.findOneAsync(attachment.meta?.boardId);
  return allowIsBoardMemberWithWriteAccess(userId, board);
}

const activityFor = (attachment, activityType, userId) => ({
  userId,
  type: 'card',
  activityType,
  attachmentId: attachment._id,
  attachmentName: attachment.name,
  boardId: attachment.meta?.boardId,
  cardId: attachment.meta?.cardId,
  listId: attachment.meta?.listId,
  swimlaneId: attachment.meta?.swimlaneId,
});

// Soft-delete one attachment on behalf of `userId`. The caller has already
// checked permission. Idempotent: an attachment that is already deleted is
// left as it is and its batch id is returned.
export async function softDeleteAttachment({ userId, attachment }) {
  const cardId = attachment.meta?.cardId;
  const card = cardId ? await Cards.findOneAsync(cardId) : null;
  const plan = softDeleteAttachmentPlan({ attachment, card, userId, at: new Date() });
  if (!plan) return null;
  if (plan.alreadyDeleted) return attachment.deleteBatchId || null;

  // A deleted attachment cannot be the cover (§12.1); restore does not put it
  // back, that is a choice about a live attachment.
  if (plan.unsetCover) {
    await Cards.updateAsync(card._id, { $unset: { coverId: '' } });
  }
  await Attachments.collection.updateAsync({ _id: attachment._id }, { $set: plan.set });

  // The activity the hard delete used to write from the store strategy's
  // onAfterRemove, with the same actor rule (#5504): the feed and the outgoing
  // webhooks see the delete exactly as before.
  if (cardId) {
    try {
      await Activities.insertAsync(
        activityFor(attachment, 'deleteAttachment', deleteActivityUserId(userId, attachment.userId)),
      );
    } catch (error) {
      console.error('Failed to insert deleteAttachment activity:', error);
    }
  }
  // A history Restore runs this same function inside withoutRecording(): the
  // restore writes its own rows, and a second one here would describe the same
  // write twice (tests/historyRestoreRecordsOnce.test.cjs).
  if (!isRecordingSuppressed()) await ChangeHistory.record(plan.historyRow);
  return plan.batchId;
}

// Restore one soft-deleted attachment. Idempotent: a live one is left alone.
export async function restoreAttachment({ userId, attachment }) {
  const plan = restoreAttachmentPlan({ attachment, userId });
  if (!plan) return false;
  if (plan.alreadyLive) return false;
  await Attachments.collection.updateAsync({ _id: attachment._id }, plan.modifier);
  if (attachment.meta?.cardId) {
    try {
      await Activities.insertAsync(activityFor(attachment, 'addAttachment', userId));
    } catch (error) {
      console.error('Failed to insert addAttachment activity:', error);
    }
  }
  if (!isRecordingSuppressed()) await ChangeHistory.record(plan.historyRow);
  return true;
}

async function loadAttachment(attachmentId) {
  // The raw collection, not ReactiveCache.getAttachment(): that one falls back
  // to the legacy CollectionFS lookup, and a soft-deleted document must be
  // found as itself, deletedAt and all.
  return Attachments.collection.findOneAsync({ _id: attachmentId });
}

Meteor.methods({
  // The ordinary "Delete" on a card's attachment (and the API's delete).
  async 'attachments.softDelete'(attachmentId) {
    check(attachmentId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const attachment = await loadAttachment(attachmentId);
    if (!attachment) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }
    if (!(await canSoftDeleteAttachment(this.userId, attachment))) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to delete this attachment');
    }
    const batchId = await softDeleteAttachment({ userId: this.userId, attachment });
    return { deleted: true, batchId };
  },

  // The card history's Restore for an attachment row also lands here, through
  // changeHistory.restore and applyAttachmentContent.
  async 'attachments.restore'(attachmentId) {
    check(attachmentId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const attachment = await loadAttachment(attachmentId);
    if (!attachment) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }
    if (!(await canSoftDeleteAttachment(this.userId, attachment))) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to restore this attachment');
    }
    const restored = await restoreAttachment({ userId: this.userId, attachment });
    return { restored };
  },
});
