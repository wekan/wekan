import RecoveryStatus, { RECOVERY_STATUS_ID } from '/models/recoveryStatus';

// #6492 Public maintenance-status publication. Everyone — including logged-out users
// on the sign-in page — must be able to see the recovery maintenance spinner, so this
// is intentionally unauthenticated. It publishes only the single status document
// (active flag + message), which carries no sensitive data. A single-document _id find
// observes cheaply (no sorted/limited live observe), so it stays reactive without the
// hang the paginated admin reports avoid.
Meteor.publish('recoveryMaintenance', function recoveryMaintenance() {
  return RecoveryStatus.find(
    { _id: RECOVERY_STATUS_ID },
    { fields: { active: 1, message: 1 } },
  );
});
