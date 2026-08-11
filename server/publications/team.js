import { ReactiveCache } from '/imports/reactiveCache';
import { safeSelector } from '/server/lib/selectorGuard';

Meteor.publish('team', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  const user = await ReactiveCache.getCurrentUser();

  let ret = [];
  // GHSA-phm4-4v26-j2vq: the check above validates the TYPE of the selector and
  // nothing else, and a selector is executable data - `$where` makes the database
  // run the caller's JavaScript per document scanned. Refuse one that carries an
  // execution operator, with the same "match nothing" the card window uses.
  const safeQuery = safeSelector(query, 'team');
  if (user && user.isAdmin) {
    ret = await ReactiveCache.getTeams(safeQuery,
      {
        limit,
        skip: skip || 0,
        sort: { createdAt: -1 },
        fields: {
          teamDisplayName: 1,
          teamDesc: 1,
          teamShortName: 1,
          teamWebsite: 1,
          teams: 1,
          createdAt: 1,
          teamIsActive: 1,
          teamSharedTemplates: 1,
          teamPropagateMembersToBoards: 1,
          teamSyncMembersFromAuth: 1,
        }
      },
      true,
    );
  }

  return ret;
});
