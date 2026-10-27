import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { startDataHealthScan, repairDataHealthCheck } from '/server/lib/dataHealthScan';

const { CHECKS } = require('/models/lib/dataHealth');

// Admin Panel → Problems → Summary: Start (Data health) and the Repair button behind each
// "Data health: ..." problem (models/lib/dataHealth.js says which checks have a
// repair and which ask for confirmation first). A repair that deletes data
// ('confirm') runs only when the call says confirmed === true - the page sends
// that on the second click - so a bare call, or an old page, cannot delete.

async function requireAdmin() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Meteor.Error('not-authorized', 'Admin only');
  }
  return user;
}

Meteor.methods({
  async dataHealthScanNow() {
    await requireAdmin();
    startDataHealthScan();
    return { started: true };
  },

  async repairDataHealth(checkId, confirmed) {
    check(checkId, String);
    check(confirmed, Match.Optional(Boolean));
    await requireAdmin();
    const kind = (CHECKS.find(c => c.id === checkId) || {}).repair;
    if (kind === 'confirm' && confirmed !== true) {
      throw new Meteor.Error('data-health-confirm', 'This repair deletes data: confirm it first.');
    }
    this.unblock();
    try {
      return await repairDataHealthCheck(checkId, { confirmed: confirmed === true });
    } catch (error) {
      throw new Meteor.Error('data-health-repair', (error && error.message) || String(error));
    }
  },
});
