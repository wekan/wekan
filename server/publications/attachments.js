import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';
import { publishReportPage } from '/models/lib/reportPageIndex';

// Escape a user-supplied search string so it is matched literally (and
// case-insensitively) instead of being interpreted as a regular expression.
function searchRegex(term) {
  return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// A note worth keeping from the per-user scoping this report used to do: some
// FerretDB v1 builds reject `{members: {$elemMatch: {userId, isActive: true}}}`
// with "(BadValue) unknown operator: userId". A publication that swallows its
// errors then returns nothing at all, silently - which is exactly how a report
// ends up empty while the data is plainly there. Match by the dotted path
// (`'members.userId'`) and confirm the element in JS when a query has to ask that.

// An ADMIN report, over the whole instance - like the Cards report beside it in
// Admin Panel / Problems. It used to be scoped to the cards the ADMIN can access,
// so on an instance where the admin is not a member of the boards, the Files report
// was empty while the Cards report listed cards from thousands of boards. The
// callers check `isAdmin`; that check is now the only thing standing between this
// and every attachment, so neither of them may drop it.
async function attachmentsReportQuery(userId, searchTerm) {
  const query = {};
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
  // Admin only: the query below is now every attachment on the instance.
  if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
    return this.ready();
  }
  this.ready();
  try {
    const query = await attachmentsReportQuery(this.userId, searchTerm);
    if (process.env.DEBUG === 'true') {
      // Diagnostic: distinguishes "no accessible cards" (query === null) from
      // "accessible cards but no matching attachments" (query set, 0 docs).
      console.log(
        '[attachmentsList] userId=%s query=%s',
        this.userId,
        JSON.stringify(query),
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
        // Paging with no sort is paging over "natural order", where a document can
        // appear on two pages or on none. By name, which is what the report shows -
        // and what the index added for it covers.
        sort: { name: 1 },
        limit,
        skip: skip || 0,
      });
      const docs =
        typeof cursor.fetchAsync === 'function' ? await cursor.fetchAsync() : cursor.fetch();
      // An admin whose report is EMPTY is worth a line whatever DEBUG says: the
      // publication answering with nothing looks exactly like the publication
      // never running, and the only way to tell them apart was to turn DEBUG on
      // and reproduce. The full count stays behind DEBUG - it is one line per
      // page of a report an admin is paging through.
      if (!(docs || []).length) {
        console.warn('[attachmentsList] no attachments matched (limit %s, skip %s)', limit, skip || 0);
      } else if (process.env.DEBUG === 'true') {
        console.log('[attachmentsList] matched %d attachment(s)', docs.length);
      }
      for (const doc of docs || []) {
        const { _id, ...fields } = doc;
        this.added('attachments', _id, fields);
      }
      // WHICH attachments this page is: opening one card puts its attachments in
      // minimongo, and the pane must not draw those as rows of this report.
      publishReportPage(this, 'report-files', docs || []);
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
