import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { ensureIndex } from './mongoStartup';
import Boards from '/models/boards';

// Private, per-document recovery data. Never publish or include in exports.
// One checkpoint per destination board prevents another import replacing it.
export const ScrumImportPending = new Mongo.Collection('scrumImportPending');
export const ScrumImportSteps = new Mongo.Collection('scrumImportSteps');
for (const collection of [ScrumImportPending, ScrumImportSteps]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
Meteor.startup(async () => {
  await ensureIndex(ScrumImportSteps, { boardId: 1, operationId: 1, index: 1 });
  Boards.after.remove(async (_userId, board) => {
    await ScrumImportPending.removeAsync(board._id);
    await ScrumImportSteps.removeAsync({ boardId: board._id });
  });
});
