import { Meteor } from 'meteor/meteor';
import CardCommentReactions from '/models/cardCommentReactions';
import { ensureIndex } from '/server/lib/mongoStartup';

// card_comment_reactions had no index at all. Every board open reads it by
// `cardId: { $in: [...all the board's card ids] }` (the card publication) and
// by `boardId` (the board publication), and both were full collection scans:
// a reported MongoDB log from one production board (.tools/crash) had 3,397
// COLLSCANs of this collection in a single log, up to 1.6 s each, on a slow
// storage backend - the bulk of that server's "Slow query" lines. The same
// three keys every other per-card collection is indexed on.
Meteor.startup(async () => {
  await ensureIndex(CardCommentReactions, { cardId: 1 });
  await ensureIndex(CardCommentReactions, { boardId: 1 });
  await ensureIndex(CardCommentReactions, { cardCommentId: 1 });
});
