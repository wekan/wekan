import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';

const { subtaskDoneDenial } = require('/models/lib/subtaskDone');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

// #4693: tick a subtask done (or not done) from the parent card's Subtasks
// list. "Done" is the subtask card's own `dueComplete` - see
// models/lib/subtaskDone.js for why - so this is the same write the card
// details' "Mark as complete" makes, with the same permission rule as every
// other card edit method (canEditCardOrLinkedCard on the SUBTASK, which may be
// on another board than the parent), plus:
//   - the subtask really is a subtask of that parent, and the caller can see
//     the parent's board (the list the tick came from);
//   - an assigned-only member of the subtask's board may tick only a subtask
//     assigned to them;
//   - an archived subtask is refused: it is already done by being archived.
//
// The write goes through Cards.updateAsync inside the method, so the
// changeHistory after.update hook (server/models/changeHistoryHooks.js)
// records it in the card's History, in the `dates` group with dueComplete,
// authored by the caller - exactly as the card details toggle is recorded.
export async function setSubtaskDoneFor(userId, parentCardId, subtaskId, done) {
  check(parentCardId, String);
  check(subtaskId, String);
  check(done, Boolean);
  if (!userId) throw new Meteor.Error('not-authorized');

  const parentCard = await Cards.findOneAsync(parentCardId, { fields: { boardId: 1 } });
  if (!parentCard || !(await canUserSeeBoard(userId, parentCard.boardId))) {
    throw new Meteor.Error('not-found');
  }
  const subtask = await Cards.findOneAsync(subtaskId);
  if (!subtask) throw new Meteor.Error('not-found');

  // A linked card shows - and is completed through - its source card
  // (Card.getDueComplete / setDueComplete), so the source is what is edited.
  let target = subtask;
  if (subtask.type === 'cardType-linkedCard') {
    target = await Cards.findOneAsync(subtask.linkedId);
    if (!target) throw new Meteor.Error('not-found');
  }
  const subtaskBoard = await Boards.findOneAsync(subtask.boardId);
  const targetBoard = target === subtask ? subtaskBoard : await Boards.findOneAsync(target.boardId);
  const canEdit = !!subtaskBoard && (await canEditCardOrLinkedCard(userId, target, targetBoard));
  const denial = subtaskDoneDenial({
    userId,
    parentCardId,
    subtask,
    canEdit,
    assignedOnly: isAssignedOnlyMember(subtaskBoard, userId),
  });
  if (denial) throw new Meteor.Error(denial);

  if (!!target.dueComplete !== done) {
    await Cards.updateAsync({ _id: target._id }, { $set: { dueComplete: done } });
  }
  return done;
}

Meteor.methods({
  async setSubtaskDone(parentCardId, subtaskId, done) {
    return await setSubtaskDoneFor(this.userId, parentCardId, subtaskId, done);
  },
});
