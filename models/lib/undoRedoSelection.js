'use strict';

// #6478: pure selection rules for the position-history undo/redo stack. Kept
// Meteor-free so they can be unit tested (tests/undoRedoSelection.test.cjs); the
// server (server/models/userPositionHistory.js) applies the same rule via Mongo
// sort/limit.
//
// Stack model: real (non-checkpoint) position changes form the undo stack in
// createdAt order. Undoing one marks it `undone` with an `undoneAt` timestamp and
// moves it onto the redo stack. Redoing clears `undone`. Recording a NEW change
// clears the redo stack (drops undone entries), so redo only ever re-applies
// changes that were not superseded.

function timeOf(d) {
  if (d instanceof Date) return d.getTime();
  if (d == null) return 0;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// The next change to UNDO: the most recent real change not already undone.
function pickUndo(entries) {
  let best = null;
  for (const e of entries || []) {
    if (!e || e.isCheckpoint || e.undone === true) continue;
    if (best === null || timeOf(e.createdAt) >= timeOf(best.createdAt)) best = e;
  }
  return best;
}

// The next change to REDO: the most-recently-undone change (largest undoneAt).
function pickRedo(entries) {
  let best = null;
  for (const e of entries || []) {
    if (!e || e.isCheckpoint || e.undone !== true) continue;
    if (best === null || timeOf(e.undoneAt) >= timeOf(best.undoneAt)) best = e;
  }
  return best;
}

module.exports = { pickUndo, pickRedo };
