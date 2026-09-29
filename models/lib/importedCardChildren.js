import Activities from '/models/activities';
import CardComments from '/models/cardComments';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import { writeImportedEntity } from '/models/lib/importPipeline';

// The checklists and comments an importer planned for one card (see
// models/lib/importedTaskPlan.js), written the same way for every source.
// .direct inserts bypass the hooks that would derive boardId, and the writer
// keeps each source creation date.
export async function insertImportedChecklists(checklists, { boardId, cardId, now }) {
  for (const checklist of checklists) {
    const checklistId = await writeImportedEntity(Checklists, {
      boardId, cardId, title: checklist.title, sort: checklist.sort, createdAt: now,
    });
    for (const item of checklist.items) {
      await ChecklistItems.direct.insertAsync({
        boardId, cardId, checklistId, title: item.title, sort: item.sort, isFinished: item.isFinished,
      });
    }
  }
}

export async function insertImportedComments(comments, { boardId, cardId, now, importerId }) {
  for (const comment of comments) {
    const createdAt = comment.createdAt || now;
    const userId = comment.userId || importerId;
    const commentId = await writeImportedEntity(CardComments, {
      boardId, cardId, createdAt, text: comment.text, userId,
    });
    // The activity feed and comment counters read addComment activities.
    await Activities.direct.insertAsync({
      activityType: 'addComment', boardId, cardId, commentId, createdAt, userId,
    });
  }
}
