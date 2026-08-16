import { Meteor } from 'meteor/meteor';
import Translation from '/models/translation';
import { safeSelector } from '/server/lib/selectorGuard';
import { ensureIndex } from '/server/lib/mongoStartup';

const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;

Meteor.methods({
  async setCreateTranslation(language, text, translationText) {
    check(language, String);
    check(text, String);
    check(translationText, String);

    if (!(await getReactiveCache().getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }

    const nTexts = (await getReactiveCache().getTranslations({ language, text })).length;
    if (nTexts > 0) {
      throw new Meteor.Error('text-already-taken');
    }

    await Translation.insertAsync({
      language,
      text,
      translationText,
    });
  },

  async setTranslationText(translation, translationText) {
    check(translation, Object);
    check(translationText, String);

    if (!(await getReactiveCache().getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }

    await Translation.updateAsync(translation, {
      $set: { translationText },
    });
  },

  async deleteTranslation(translationId) {
    check(translationId, String);

    if (!(await getReactiveCache().getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }

    await Translation.removeAsync(translationId);
  },

  // The total behind the "page X / N" counter of the Translation table page
  // (docs/Features/Page/Table.md). It counts the whole result set - the page itself
  // only ever holds 25 rows - so it is a separate call, made when the pane opens
  // and when the search changes, never on a prev/next click.
  async getTranslationsCollectionCount(query = {}) {
    check(query, Match.OneOf(Object, null, undefined));
    if (!(await getReactiveCache().getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await getReactiveCache().getTranslations(safeSelector(query || {}, 'getTranslationsCollectionCount'), {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await ensureIndex(Translation, { modifiedAt: -1 });
});
