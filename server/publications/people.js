import { ReactiveCache } from '/imports/reactiveCache';
import { safeSelector } from '/server/lib/selectorGuard';

// Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.7): the site
// admin still sees every user, and a PER-TENANT Global Admin sees the members of
// the orgs they administer - nobody else sees anyone. The scoping is decided by
// models/lib/tenantAdmin.js, which merges the restriction with the caller's query
// under $and so a crafted query cannot argue it away.
import * as tenantAdmin from '/models/lib/tenantAdmin';

Meteor.publish('people', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  // GHSA-phm4-4v26-j2vq: the check above validates the TYPE of the selector and
  // nothing else, and a selector is executable data - `$where` makes the database
  // run the caller's JavaScript per document scanned. Refuse one that carries an
  // execution operator, with the same "match nothing" the card window uses.
  const safeQuery = safeSelector(query, 'people');
  if (tenantAdmin.canOpenAdminPanel(user)) {
    ret = await ReactiveCache.getUsers(tenantAdmin.peopleScopeSelector(user, safeQuery), {
      limit,
      skip: skip || 0,
      sort: { createdAt: -1 },
      fields: {
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
        'profile.avatarUrl': 1,
        isAdmin: 1,
        emails: 1,
        createdAt: 1,
        loginDisabled: 1,
        authenticationMethod: 1,
        importUsernames: 1,
        orgs: 1,
        teams: 1,
      },
    },
    true);
  }

  return ret;
});
