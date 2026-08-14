import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { findWhere, where } from '/imports/lib/collectionHelpers';
import { getFeatureFlags } from '/models/lib/featureFlags';

// Activities don't need a schema because they are always set from the a trusted
// environment - the server - and there is no risk that a user change the logic
// we use with this collection. Moreover using a schema for this collection
// would be difficult (different activities have different fields) and wouldn't
// bring any direct advantage.
//
// XXX The activities API is not so nice and need some functionalities. For
// instance if a user archive a card, and un-archive it a few seconds later we
// should remove both activities assuming it was an error the user decided to
// revert.
const Activities = new Mongo.Collection('activities');

Activities.helpers({
  board() {
    return ReactiveCache.getBoard(this.boardId);
  },
  oldBoard() {
    return ReactiveCache.getBoard(this.oldBoardId);
  },
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  member() {
    return ReactiveCache.getUser(this.memberId);
  },
  list() {
    return ReactiveCache.getList(this.listId);
  },
  swimlane() {
    return ReactiveCache.getSwimlane(this.swimlaneId);
  },
  oldSwimlane() {
    return ReactiveCache.getSwimlane(this.oldSwimlaneId);
  },
  oldList() {
    return ReactiveCache.getList(this.oldListId);
  },
  card() {
    return ReactiveCache.getCard(this.cardId);
  },
  comment() {
    return ReactiveCache.getCardComment(this.commentId);
  },
  // #3606: text to show for editComment/deleteComment activities — the stored
  // commentText, else the live comment's text, else '' (never "undefined").
  commentDisplayText() {
    const { commentActivityDisplayText } = require('./lib/commentActivity');
    return commentActivityDisplayText({
      commentText: this.commentText,
      comment: this.comment(),
    });
  },
  attachment() {
    return ReactiveCache.getAttachment(this.attachmentId);
  },
  checklist() {
    return ReactiveCache.getChecklist(this.checklistId);
  },
  checklistItem() {
    return ReactiveCache.getChecklistItem(this.checklistItemId);
  },
  subtasks() {
    return ReactiveCache.getCard(this.subtaskId);
  },
  customField() {
    return ReactiveCache.getCustomField(this.customFieldId);
  },
  label() {
    // Label activity did not work yet, unable to edit labels when tried this.
    return ReactiveCache.getCard(this.labelId);
  },
});

Activities.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

Activities.before.insert((userId, doc) => {
  // Admin Panel / Features / Notifications (#5820): stop recording activities
  // entirely when disabled. Returning false cancels the insert, so no activity-feed
  // entry is stored and the notification after.insert hook never fires.
  if (getFeatureFlags().disableActivities) {
    return false;
  }
  doc.createdAt = new Date();
  doc.modifiedAt = doc.createdAt;
});

if (Meteor.isServer) {
  // The card's Activities feed and the board's sidebar both ask for one scope
  // sorted by createdAt descending, with a limit - the publication says so in
  // its own comment about pushing the selector down to an index. There was no
  // index to push it down to, so every poll walked the whole collection, which
  // on a board with a year of history is the slowest thing a card does.
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(Activities, { cardId: 1, createdAt: -1 });
    await ensureIndex(Activities, { boardId: 1, createdAt: -1 });
    await ensureIndex(Activities, { checklistId: 1 });
  });
}

export default Activities;
