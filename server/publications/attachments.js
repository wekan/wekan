import Attachments from '/models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';

// Escape a user-supplied search string so it is matched literally (and
// case-insensitively) instead of being interpreted as a regular expression.
function searchRegex(term) {
  return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// Card ids the given user is allowed to see attachments for. Shared by the
// paginated 'attachmentsList' publication and its matching count method so the
// total and the published page are always computed over the same set.
//
// Query the model collections DIRECTLY with fetchAsync, NOT ReactiveCache: the
// Files report publication must always reach this.ready(), and a ReactiveCache
// read that does not resolve would leave the whole report stuck on the loading
// spinner (subscription never ready). Raw async fetches always resolve.
async function accessibleCardIds(userId) {
  // Avoid `$elemMatch` on `members`: some FerretDB v1 builds (e.g. the one bundled
  // before the fork moved past upstream v1.24) reject `{members:{$elemMatch:{userId,
  // isActive:true}}}` with "(BadValue) unknown operator: userId", which — swallowed by
  // the publish's catch below — made this report silently return nothing (#Files
  // report). Match "the user is a member" by the dotted path (works on every FerretDB
  // build) and then confirm in JS that the user's OWN member entry is active, which
  // preserves the exact per-element semantics `$elemMatch` gives. A given userId
  // appears in at most one member entry, so this is equivalent.
  const boards = await Boards.find(
    {
      $or: [
        { permission: 'public' },
        { 'members.userId': userId },
      ],
    },
    { fields: { _id: 1, permission: 1, members: 1 } },
  ).fetchAsync();
  const boardIds = boards
    .filter(board =>
      board.permission === 'public' ||
      (board.members || []).some(m => m.userId === userId && m.isActive))
    .map(board => board._id);

  if (boardIds.length === 0) {
    return [];
  }

  const cards = await Cards.find(
    { boardId: { $in: boardIds }, archived: false },
    { fields: { _id: 1 } },
  ).fetchAsync();
  return cards.map(card => card._id);
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

  // Publish the page MANUALLY (this.added + this.ready) instead of returning a live
  // cursor. A returned cursor with sort+limit makes Meteor set up a LIMITED live
  // observe, which hangs on FerretDB's oplog for this query — the subscription then
  // never becomes ready and the Files report is stuck on the loading spinner. This
  // admin report re-subscribes on every page/search change, so it needs no live
  // reactivity.
  //
  // Signal readiness UP FRONT: the report template only renders once the subscription
  // is ready, so calling this.ready() first guarantees the spinner clears no matter
  // what the fetch below does (previous versions hung on an await before reaching
  // this.ready() in a `finally`, leaving the report stuck on the spinner forever). The
  // page rows are then streamed with this.added and appear reactively in the table.
  this.ready();
  try {
    const query = await attachmentsReportQuery(this.userId, searchTerm);
    if (process.env.DEBUG === 'true') {
      // Diagnostic: distinguishes "no accessible cards" (query === null) from
      // "accessible cards but no matching attachments" (query set, 0 docs).
      console.log(
        '[attachmentsList] userId=%s query=%s',
        this.userId,
        query ? JSON.stringify(query) : 'null (user has no accessible cards)',
      );
    }
    if (query) {
      // Query the plain Mongo collection directly (Attachments.collection), NOT
      // ReactiveCache.getAttachments(): the latter fetches through the ostrio
      // FilesCollection cursor and falls back to getAttachmentsWithBackwardCompatibility(),
      // whose old-CFS lookups can hang. A direct find on the 'attachments' collection
      // returns the page and always resolves.
      const cursor = Attachments.collection.find(query, {
        fields: { _id: 1, name: 1, size: 1, type: 1, meta: 1, path: 1, versions: 1 },
        limit,
        skip: skip || 0,
      });
      const docs =
        typeof cursor.fetchAsync === 'function' ? await cursor.fetchAsync() : cursor.fetch();
      if (process.env.DEBUG === 'true') {
        console.log('[attachmentsList] matched %d attachment(s)', (docs || []).length);
      }
      for (const doc of docs || []) {
        const { _id, ...fields } = doc;
        this.added('attachments', _id, fields);
      }
    }
  } catch (e) {
    // NEVER swallow this silently: a hidden throw here surfaces as an empty Files
    // report with no clue in the logs (which is exactly how this hid for so long).
    console.error('[attachmentsList] publish failed:', (e && e.stack) || e);
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
    // Count on the plain collection directly (same reason as the publish above:
    // avoid the ostrio cursor / backward-compatibility path).
    const cursor = Attachments.collection.find(query);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});
