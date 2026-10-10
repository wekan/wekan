'use strict';

// #4693: tick a subtask done right in the parent card's Subtasks list, and show
// "done/total" in the section heading.
//
// WHAT "DONE" MEANS FOR A SUBTASK. A subtask is an ordinary card (with this
// card in its parentId/parentIds, models/lib/cardParents.js), so its "done" is
// a card's "done", and WeKan already has two:
//
//   - `dueComplete` - the card's own "Mark as complete" flag. The card details
//     and the minicard toggle it, the rules engine sets it (markCardComplete),
//     Trello imports it, and Scrum's default completion policy reads it
//     (models/lib/scrum.js isScrumCardDone). It is the one completion flag a
//     card has, so it is what the checkbox ticks - no new field.
//   - `archived` - #3409/#4050 made an archived subtask stay in the list shown
//     as completed, and the minicard's "M/N" badge counted archived ones as
//     finished. That stays true: archiving is still a way to finish one.
//
// So a subtask is done when it is marked complete OR archived. Being in a list
// called "Done" is not used: list names are free text, and Scrum's doneLists
// is a per-board Scrum setting, not a property of a subtask.
//
// Pure: no Meteor, no database. The client helpers, the server method and
// tests/subtaskDone4693.test.cjs all read this one file.

const isId = value => typeof value === 'string' && value.length > 0;

function isSubtaskDone(subtask) {
  return !!subtask && (subtask.dueComplete === true || subtask.archived === true);
}

// The same rule as a Mongo selector, for the minicard badge's numerator
// (models/cards.js subtasksFinished). Kept in step with isSubtaskDone by
// tests/subtaskDone4693.test.cjs.
function subtaskDoneSelector() {
  return { $or: [{ archived: true }, { dueComplete: true }] };
}

// { done, total } of the subtasks the caller passes. The caller passes only the
// subtasks the viewer can read - on the client that is what minimongo holds,
// and the board publication sends a deposit board's cards only to a user who
// may see that board, narrowed to their own cards for an assigned-only member
// (server/publications/boards.js) - so a subtask on a board the viewer cannot
// read is neither shown nor counted.
function subtaskDoneSummary(subtasks) {
  const list = (Array.isArray(subtasks) ? subtasks : []).filter(Boolean);
  return { done: list.filter(isSubtaskDone).length, total: list.length };
}

// "1/3" for the section heading, or null when there are no subtasks (the
// heading then shows no count at all, like every other section).
function subtaskDoneCountLabel(subtasks) {
  const { done, total } = subtaskDoneSummary(subtasks);
  return total ? `${done}/${total}` : null;
}

// Why ticking/unticking `subtask` is refused for `userId`, or null when it is
// allowed. The caller resolves what needs the database:
//   parentCardId  the card whose Subtasks list the tick came from
//   subtask       the subtask card document (null when it does not exist)
//   canEdit       may this user EDIT the subtask - on the server
//                 canEditCardOrLinkedCard (board write access, or a link on a
//                 board they may write), on the client Utils.canModifyCard
//   assignedOnly  is the user an assigned-only member of the subtask's board
//                 (models/lib/boardCardScope.js isAssignedOnlyMember)
//
// Comment-only, read-only, worker and no-access users have no `write`
// capability (models/lib/boardRoleCapabilities.js), so canEdit is false for
// them. A Worker may tick a CHECKLIST item (#3307) but not finish a card: that
// is a card edit. An assigned-only member may finish only a subtask assigned
// to them - the only subtasks they can see.
function subtaskDoneDenial({ userId, parentCardId, subtask, canEdit, assignedOnly } = {}) {
  if (!isId(userId)) return 'not-authorized';
  if (!subtask || !isId(subtask._id)) return 'not-found';
  if (!isId(parentCardId)) return 'not-found';
  const parents = [subtask.parentId, ...(Array.isArray(subtask.parentIds) ? subtask.parentIds : [])];
  if (!parents.includes(parentCardId)) return 'not-a-subtask';
  if (subtask.type === 'cardType-linkedBoard') return 'not-a-subtask';
  if (canEdit !== true) return 'not-authorized';
  if (assignedOnly === true && !(Array.isArray(subtask.assignees) && subtask.assignees.includes(userId))) {
    return 'not-authorized';
  }
  // An archived subtask is already done by being archived; ticking it would
  // change a card nobody can see on its board. Restore it to change it.
  if (subtask.archived === true) return 'subtask-archived';
  return null;
}

module.exports = {
  isSubtaskDone,
  subtaskDoneSelector,
  subtaskDoneSummary,
  subtaskDoneCountLabel,
  subtaskDoneDenial,
};
