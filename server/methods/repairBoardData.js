import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { detectBoardRepairs, runBoardRepair } from '/server/lib/repairBoardData';

// Meteor methods behind the board-open self-heal (client/components/boards/
// boardBody.js -> maybeRepairBoard). The heavy lifting lives in
// /server/lib/repairBoardData.js, shared with the DB text migration.

Meteor.methods({
  // Detection: called cheaply when a board opens. Board members may check; only a
  // board admin may repair (canRepair), so the client auto-repairs only when there
  // is something to fix AND the viewer is allowed to fix it.
  async boardRepairNeeded(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.hasMember(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You must be a board member.');
    }
    const counts = await detectBoardRepairs(boardId);
    return { ...counts, canRepair: board.hasAdmin(this.userId) === true };
  },

  // Repair: board-admin only. Runs the shared repair set (#6484 list-unbind +
  // missing-swimlane and orphaned cards). Idempotent. Returns what was fixed.
  async repairBoardData(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to repair this board.');
    }
    return runBoardRepair(boardId);
  },
});
