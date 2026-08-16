import { Mongo } from 'meteor/mongo';
import { REPORT_PAGE_COLLECTION } from '/models/lib/reportPageIndex';

// The page index the paginated publications send (models/lib/reportPageIndex.js):
// one document per report, holding the ids of the page the SERVER chose, in the
// order it sorted them.
//
// Client-only — there is no `report_pages` collection on the server, the
// publications just address documents to that name over DDP — and declared HERE,
// once, because `new Mongo.Collection(name)` throws if the name is taken. It used
// to live inside adminProblems.js, so the second page to need it (/public) could
// not have one.
export const ReportPages = new Mongo.Collection(REPORT_PAGE_COLLECTION);

// The documents of the page the server named, in the order it sorted them.
//
// A plain `collection.find()` shows whatever minimongo holds, which is right only
// for a collection nothing else fills. Boards and Cards are not those: every board
// the user has opened is in minimongo, so a page that read the collection drew
// rows from other pages while its pager - counted on the server - said "1 / 1".
export function reportPageDocs(collection, reportId, docsByIds) {
  const index = ReportPages.findOne(reportId);
  const ids = (index && index.ids) || [];
  if (!ids.length) return [];
  return docsByIds(ids, collection.find({ _id: { $in: ids } }).fetch());
}
