// WHICH documents one page of an Admin Panel report consists of.
//
// The paginated reports (Problems / Broken cards, Cards, Boards) publish exactly
// one page: server-side search, sort, limit and skip, sent with `this.added`. The
// pane then reads that page back out of minimongo - and minimongo holds far more
// than the page. Every card of every board the admin has opened is in there, every
// board they are a member of, everything the previous report left behind. A plain
// `Cards.find({})` cannot tell those apart from the page, so Broken cards rendered
// hundreds of rows while its pager - which counts on the server - correctly said
// "1 / 1". Admin Panel / People had the same bug in its own shape: the admin's own
// user record is always in minimongo, so the admin appeared on all 578 pages.
//
// The publication knows the answer, so it says it: alongside the page it sends one
// small document listing the page's ids IN THE ORDER IT SORTED THEM. The pane
// renders that list (see docsByIds in models/lib/tablePage.js) and nothing else.
// It is a DDP-only collection - no server-side Mongo collection is created for it;
// the client declares a Mongo.Collection with this name to receive it.

export const REPORT_PAGE_COLLECTION = 'report_pages';

// Send the index for `reportId` from inside a publication (`this`).
// Documents without an `_id` are skipped rather than published as a null id.
export function publishReportPage(publication, reportId, docs) {
  const ids = (Array.isArray(docs) ? docs : [])
    .map(doc => doc && doc._id)
    .filter(Boolean);
  publication.added(REPORT_PAGE_COLLECTION, reportId, { ids });
}
