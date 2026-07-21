import RecoveryStatus from '/models/recoveryStatus';

// #6492 Full-page maintenance spinner shown while a data recovery / remediation is in
// progress (the server sets RecoveryStatus active). Subscribed globally so it can
// appear on any page, logged in or not.
Template.recoveryMaintenance.onCreated(function () {
  this.subscribe('recoveryMaintenance');
});

Template.recoveryMaintenance.helpers({
  isMaintenanceActive() {
    return RecoveryStatus.isMaintenanceActive();
  },
  maintenanceMessage() {
    return RecoveryStatus.maintenanceMessage();
  },
});
