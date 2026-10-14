import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import CardComments from '/models/cardComments';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

// Boards every signed-in user may edit (#4575, decided 2026-10-14), the server
// half: whether Admin Panel allows them at all (kept current for the
// synchronous permission checks in models/lib/boardRoleCapabilities.js), and
// the membership a user's first edit gives them.
//
// The membership is what makes their changes attributed: the member list then
// shows who has been editing, and a board admin can change their role or
// remove them like anybody else - and a removed user stays removed, because
// memberCan refuses an inactive entry.
const { setInstanceEditingLookup, instanceEditable } = require('/models/lib/boardRoleCapabilities');

export const INSTANCE_EDITING_SETTING = 'tableVisibilityMode-allowInstanceEditing';

let allowed = false;
setInstanceEditingLookup(() => allowed);

Meteor.startup(async () => {
  await TableVisibilityModeSettings.find({ _id: INSTANCE_EDITING_SETTING }, { fields: { booleanValue: 1 } }).observeChangesAsync({
    added: (id, fields) => { allowed = fields.booleanValue === true; },
    changed: (id, fields) => { if ('booleanValue' in fields) allowed = fields.booleanValue === true; },
    removed: () => { allowed = false; },
  });
});

// The first edit by a non-member makes them a Normal member.
async function joinOnEdit(userId, boardId) {
  if (!userId || !boardId) return;
  try {
    const board = await Boards.findOneAsync(boardId);
    if (!board || !instanceEditable(board)) return;
    if ((board.members || []).some(m => m && m.userId === userId)) return;
    await board.addMember(userId);
  } catch (error) {
    console.error('instance editing: could not add the editor as a member', error);
  }
}

// A checklist knows only its card; everything else knows its board.
async function boardOf(doc) {
  if (!doc) return null;
  if (doc.boardId) return doc.boardId;
  if (doc.cardId) {
    const card = await Cards.findOneAsync(doc.cardId, { fields: { boardId: 1 } });
    return card && card.boardId;
  }
  return null;
}
const join = (userId, doc) => { if (userId) boardOf(doc).then(boardId => joinOnEdit(userId, boardId)); };
for (const collection of [Cards, Lists, Swimlanes, Checklists, ChecklistItems, CardComments]) {
  collection.after.insert(join);
  collection.after.update(join, { fetchPrevious: false });
}

export { joinOnEdit };
