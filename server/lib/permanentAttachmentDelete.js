import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Attachments from '/models/attachments';
import { getFeatureFlags } from '/models/lib/featureFlags';
import RecoveryEvents from '/models/recoveryEvents';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';
const { cleanFileName } = require('/imports/lib/fileNameDisplay');

export async function permanentlyDeleteAttachmentFromFilesReport(
  userId, attachmentId, connection,
) {
  let user;
  let attachment;
  try {
    check(attachmentId, String);
    user = userId && await Meteor.users.findOneAsync(userId, {
      fields: { _id: 1, username: 1, isAdmin: 1 },
    });
    if (user?.isAdmin !== true || !getFeatureFlags().enablePermanentDelete) {
      throw new Meteor.Error('not-authorized', 'Permanent delete is disabled.');
    }
    attachment = await Attachments.collection.findOneAsync(
      { _id: attachmentId }, { fields: { _id: 1, name: 1, meta: 1 } },
    );
    if (!attachment) throw new Meteor.Error('attachment-not-found');
    await Attachments.removeAsync(attachmentId);
    await recordRecoveryAudit({
      type: RecoveryEvents.types.ATTACHMENT_PERMANENTLY_DELETED,
      user, connection, done: true, deletedData: true,
      detail: `Global Admin ${user.username || user._id} (${user._id}) permanently deleted attachment ${attachmentId} named ${JSON.stringify(cleanFileName(attachment.name || ''))} from card ${attachment.meta?.cardId || '(unknown)'}.`,
    });
    return true;
  } catch (error) {
    await recordRecoveryAudit({
      type: RecoveryEvents.types.ATTACHMENT_PERMANENTLY_DELETED,
      user, connection, done: false,
      detail: `User ${user?.username || user?._id || 'unknown'} (${user?._id || 'not logged in'}) failed to permanently delete attachment ${String(attachmentId || '').slice(0, 100)}: ${error.reason || error.message || 'unknown error'}.`,
    });
    throw error;
  }
}
