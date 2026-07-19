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

  const query = await attachmentsReportQuery(this.userId, searchTerm);
  if (!query) {
    return this.ready();
  }

  const ret = (await ReactiveCache.getAttachments(
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
      sort: {
        name: 1,
      },
      limit,
      skip: skip || 0,
    },
    true,
  )).cursor;
  return ret;
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
