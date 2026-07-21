import { Mongo } from 'meteor/mongo';

// #6492 Recovery maintenance status — a single published document that tells every
// client (logged in or not) that a data recovery / remediation is in progress, so the
// UI can show a full-page maintenance spinner instead of errors or half-loaded data.
const RecoveryStatus = new Mongo.Collection('recoveryStatus');

// The one document id. Only the server ever writes it.
const RECOVERY_STATUS_ID = 'recovery-status';

// setMaintenance turns the maintenance spinner on/off with an optional message.
// Server-only and best-effort (never throws into the recovery flow).
RecoveryStatus.setMaintenance = async function setMaintenance(active, message) {
  if (!Meteor.isServer) {
    return null;
  }

  try {
    return await RecoveryStatus.upsertAsync(
      { _id: RECOVERY_STATUS_ID },
      { $set: { active: !!active, message: message || '', updatedAt: new Date() } },
    );
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.error('RecoveryStatus.setMaintenance failed:', e && e.message);
    }
    return null;
  }
};

// isMaintenanceActive reports the current flag (reactive on the client via the
// published document).
RecoveryStatus.isMaintenanceActive = function isMaintenanceActive() {
  const doc = RecoveryStatus.findOne(RECOVERY_STATUS_ID);
  return !!(doc && doc.active);
};

RecoveryStatus.maintenanceMessage = function maintenanceMessage() {
  const doc = RecoveryStatus.findOne(RECOVERY_STATUS_ID);
  return (doc && doc.message) || '';
};

export { RECOVERY_STATUS_ID };
export default RecoveryStatus;
