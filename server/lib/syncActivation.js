'use strict';
// Sync activation, maintainer decision of 2026-09-30: running rules,
// notifications and webhooks for changes that Sync makes is OFF by default.
// A board administrator enables it per board (board.syncEffectsEnabled) and an
// instance administrator enables it for scheduled runs separately (Admin
// Panel flag enableSyncCronEffects), so an upgrade changes nothing on its own.
//
// Every stored-effect stage checks this in its guard, before and during work,
// so whatever later wires manual or scheduled Sync to these stages cannot
// skip it: the caller must say which trigger it is, and there is no default.
const TRIGGERS = ['manual', 'scheduled'];
function validateSyncTrigger(trigger) {
  if (!TRIGGERS.includes(trigger)) throw new Error('sync-activation-trigger-required');
  return trigger;
}
function assertSyncActivation({ board, trigger, flags }) {
  validateSyncTrigger(trigger);
  if (!board || board.syncEffectsEnabled !== true) throw new Error('sync-effects-not-enabled');
  if (trigger === 'scheduled' && flags?.enableSyncCronEffects !== true) throw new Error('sync-cron-effects-not-enabled');
}
module.exports = { validateSyncTrigger, assertSyncActivation, SYNC_TRIGGERS: TRIGGERS };
