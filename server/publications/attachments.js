import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';

// Escape a user-supplied search string so it is matched literally (and
// case-insensitively) instead of being interpreted as a regular expression.
function searchRegex(term) {
  return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// Card ids the given user is allowed to see attachments for. Shared by the
// paginated 'attachmentsList' publication and its matching count method so the
// total and the published page are always computed over the same set.
async function accessibleCardIds(userId) {
  const userBoards = (await ReactiveCache.getBoards({
    $or: [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } }
    ]
  })).map(board => board._id);

  if (userBoards.length === 0) {
    return [];
  }

  return (await ReactiveCache.getCards({
    boardId: { $in: userBoards },
    archived: false
  })).map(card => card._id);
}

// Build the attachments query for the report: restricted to accessible cards,
// optionally filtered by attachment name. Returns null when the user has no
// accessible cards (caller should publish/return nothing).
async function attachmentsReportQuery(userId, searchTerm) {
  const userCards = await accessibleCardIds(userId);
  if (userCards.length === 0) {
    return null;
  }
  const query = { 'meta.cardId': { $in: userCards } };
  if (searchTerm) {
    query.name = searchRegex(searchTerm);
  }
  return query;
}

Meteor.publish('attachmentsList', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  // Publish the page MANUALLY (fetch + this.added + this.ready) instead of returning
  // a live cursor. A returned cursor with sort+limit makes Meteor set up a LIMITED
  // live observe, which hangs on FerretDB's oplog for this query — the subscription
  // then never becomes ready and the Files report is stuck on the loading spinner
  // forever. This admin report re-subscribes on every page/search change, so it does
  // not need live reactivity; a one-shot fetch guarantees `ready` fires.
  //
  // The whole body is wrapped so `this.ready()` ALWAYS runs (in `finally`): if the
  // fetch throws, the report shows its empty state instead of hanging. No server-side
  // `sort` is used — the ostrio `attachments` collection has no index on `name`, and
  // the client re-sorts the page by name for display anyway (collectionResults).
  try {
    const query = await attachmentsReportQuery(this.userId, searchTerm);
    if (query) {
      const docs = await ReactiveCache.getAttachments(
        query,
        {
          fields: {
            _id: 1,
            name: 1,
            size: 1,
            type: 1,
            meta: 1,
            path: 1,
            versions: 1,
          },
          limit,
          skip: skip || 0,
        },
        false,
      );
      for (const doc of docs || []) {
        const { _id, ...fields } = doc;
        this.added('attachments', _id, fields);
      }
    }
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.error('attachmentsList publish failed:', e && e.message);
    }
  } finally {
    this.ready();
  }
});

Meteor.methods({
  async getAttachmentsReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const query = await attachmentsReportQuery(this.userId, searchTerm);
    if (!query) {
      return 0;
    }
    const cursor = (await ReactiveCache.getAttachments(query, {}, true)).cursor;
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});
