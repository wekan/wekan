import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('translation', async function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  if (user && user.isAdmin) {
    ret = await ReactiveCache.getTranslations(query,
      {
        limit,
        sort: { modifiedAt: -1 },
        fields: {
          language: 1,
          text: 1,
          translationText: 1,
          createdAt: 1,
        }
      },
      true,
    );
  }

  return ret;
});
