import { ReactiveCache } from '/imports/reactiveCache';
import {
  ADMIN_TRANSLATIONS_PAGE_SIZE,
  translationSearchSelector,
} from '/server/lib/adminTranslations';
import Translation from '/models/translation';

// Public runtime overrides are presentation strings, and are needed before
// sign-in too. This separate publication accepts one validated language tag,
// never a selector or caller-chosen window, and exposes no metadata.
Meteor.publish('translationLanguage', function(language) {
  check(language, String);
  if (!/^[A-Za-z0-9@_-]{1,5}$/.test(language)) return [];
  return Translation.find({ language }, {
    fields: { language: 1, text: 1, translationText: 1 },
  });
});

// ONE page of custom translation strings (docs/Features/Page/Table.md): the limit and
// the skip are applied server-side, so only the rows that are displayed ever reach
// minimongo. `skip` was added when Admin Panel / Settings / Translation became a
// shared table page - it used to grow one window at a time by infinite scroll, so
// paging back to page 1 still had every earlier page in memory.
Meteor.publish('translation', async function(search, limit, skip = 0) {
  check(search, String);
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!Number.isSafeInteger(limit) || limit < 1
    || !Number.isSafeInteger(skip || 0) || (skip || 0) < 0) {
    throw new Meteor.Error('invalid-page');
  }

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  // A search string is inert data. Build the bounded, escaped literal selector on
  // the server; a client can no longer submit Mongo operators to this publication.
  const safeQuery = translationSearchSelector(search);
  if (user && user.isAdmin) {
    ret = await ReactiveCache.getTranslations(safeQuery,
      {
        limit: Math.min(limit, ADMIN_TRANSLATIONS_PAGE_SIZE),
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
