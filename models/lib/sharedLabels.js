'use strict';

// Shared labels (#2761, #4698; decided 2026-10-14): an instance-wide catalog
// in the Admin Panel, plus catalogs per organization and per team. A board uses
// shared labels beside its own.
//
// A shared label is used on a board by COPYING it into board.labels, linked by
// `sharedLabelId`. Everything that already works on board labels - filters,
// rules, exports, imports, the minicard - then works on shared ones too, with
// nothing to learn. Renaming or recolouring a shared label updates every copy;
// deleting it leaves the copies as the boards' own labels.
// Pure: tests/sharedLabels.test.cjs.

const SCOPES = ['instance', 'org', 'team'];
const NAME_MAX = 100;

function activeIds(list, idField) {
  return new Set((Array.isArray(list) ? list : []).filter(x => x && x.isActive !== false && x[idField]).map(x => x[idField]));
}

/** May this shared label be used on this board? */
function availableOn(label, board) {
  if (!label || !board) return false;
  if (label.scope === 'instance') return true;
  if (label.scope === 'org') return activeIds(board.orgs, 'orgId').has(label.scopeId);
  if (label.scope === 'team') return activeIds(board.teams, 'teamId').has(label.scopeId);
  return false;
}

/** The shared labels a board may use that it does not have yet. */
function offeredTo(board, sharedLabels) {
  const have = new Set((board && board.labels || []).map(l => l && l.sharedLabelId).filter(Boolean));
  return (Array.isArray(sharedLabels) ? sharedLabels : []).filter(l => availableOn(l, board) && !have.has(l._id));
}

/** The board's copy of a shared label. `newId` makes the board-label id. */
function boardCopyOf(label, newId) {
  return { _id: newId, name: label.name || '', color: label.color, sharedLabelId: label._id };
}

/** A label to save, cleaned and checked; throws a message key when it is not. */
function cleanSharedLabel(input, isAllowedColor) {
  const name = String(input && input.name || '').trim();
  const color = String(input && input.color || '').trim();
  const scope = String(input && input.scope || '');
  const scopeId = scope === 'instance' ? null : String(input && input.scopeId || '');
  if (name.length > NAME_MAX) throw new Error('shared-label-name-too-long');
  if (!isAllowedColor(color)) throw new Error('shared-label-color');
  if (!SCOPES.includes(scope)) throw new Error('shared-label-scope');
  if (scope !== 'instance' && !scopeId) throw new Error('shared-label-scope');
  return { name, color, scope, scopeId };
}

module.exports = { SCOPES, NAME_MAX, availableOn, offeredTo, boardCopyOf, cleanSharedLabel };
