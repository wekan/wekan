import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { restoreListSwimlanes } from '/server/lib/restoreListSwimlanes';
import { setBoardRepairStatus } from '/server/lib/systemStatus';

// Admin Panel → Problems → Summary: the "Restore" button behind the
// "Lists missing their swimlane N" problem
// (client/components/settings/problemsSummary.js), the same shape as the
// "Broken cards N" repair beside it.
//
// #6670. The pre-#6515 automatic board repair cleared the swimlaneId of every
// per-swimlane list on every board it opened, so those lists render under every
// swimlane and deleting one from a swimlane deletes the only copy there is. The
// binding each list was CREATED with is still recorded in positionHistory - the
// clearing went through `.direct` and never touched it - so this puts back what
// was recorded, exactly, and skips every list where the record is missing or the
// swimlane is gone. Nothing is inferred; see /models/lib/listSwimlaneRestore.js.

Meteor.methods({
  async restoreListSwimlanes() {
    if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
      throw new Meteor.Error('not-authorized', 'You must be an admin.');
    }
    this.unblock();

    await setBoardRepairStatus({
      running: true,
      phase: 'repairing',
      kind: 'admin-restore-list-swimlanes',
      startedAt: new Date().toISOString(),
      success: null,
      error: '',
    });

    try {
      const summary = await restoreListSwimlanes();
      await setBoardRepairStatus({
        running: false,
        phase: 'completed',
        kind: 'admin-restore-list-swimlanes',
        finishedAt: new Date().toISOString(),
        success: true,
        repaired: summary,
      });
      console.log('[restoreListSwimlanes] done', summary);
      return summary;
    } catch (error) {
      await setBoardRepairStatus({
        running: false,
        phase: 'error',
        kind: 'admin-restore-list-swimlanes',
        success: false,
        error: String(error && error.message ? error.message : error).slice(0, 500),
      });
      console.error('[restoreListSwimlanes]', error);
      throw new Meteor.Error(
        'restore-failed',
        String(error && error.message ? error.message : error),
      );
    }
  },
});
