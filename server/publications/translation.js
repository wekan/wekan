import { ReactiveCache } from '/imports/reactiveCache';
import { safeSelector } from '/server/lib/selectorGuard';

// ONE page of custom translation strings (docs/Features/Page/Table.md): the limit and
// the skip are applied server-side, so only the rows that are displayed ever reach
// minimongo. `skip` was added when Admin Panel / Settings / Translation became a
// shared table page - it used to grow one window at a time by infinite scroll, so
// paging back to page 1 still had every earlier page in memory.
Meteor.publish('translation', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  // GHSA-phm4-4v26-j2vq: the check above validates the TYPE of the selector and
  // nothing else, and a selector is executable data - `$where` makes the database
  // run the caller's JavaScript per document scanned. Refuse one that carries an
  // execution operator, with the same "match nothing" the card window uses.
  const safeQuery = safeSelector(query, 'translation');
  if (user && user.isAdmin) {
    ret = await ReactiveCache.getTranslations(safeQuery,
      {
        limit,
        skip: skip || 0,
        sort: { modifiedAt: -1 },
        fields: {
          language: 1,
          text: 1,
          translationText: 1,
          createdAt: 1,
          modifiedAt: 1,
        }
      },
      true,
    );
  }

  return ret;
});
