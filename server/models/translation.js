import { Meteor } from 'meteor/meteor';
import Translation from '/models/translation';
import { ensureIndex } from '/server/lib/mongoStartup';
import {
  createTranslationForAdmin,
  deleteTranslationForAdmin,
  translationSearchSelector,
  updateTranslationForAdmin,
} from '/server/lib/adminTranslations';

const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;

Meteor.methods({
  async setCreateTranslation(language, text, translationText) {
    return createTranslationForAdmin(this.userId, language, text, translationText);
  },

  async setTranslationText(translationId, translationText) {
    return updateTranslationForAdmin(this.userId, translationId, translationText);
  },

  async deleteTranslation(translationId) {
    return deleteTranslationForAdmin(this.userId, translationId);
  },

  // The total behind the "page X / N" counter of the Translation table page
  // (docs/Features/Page/Table.md). It counts the whole result set - the page itself
  // only ever holds 25 rows - so it is a separate call, made when the pane opens
  // and when the search changes, never on a prev/next click.
  async getTranslationsCollectionCount(search = '') {
    check(search, String);
    if (!(await getReactiveCache().getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await getReactiveCache().getTranslations(
      translationSearchSelector(search), {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await ensureIndex(Translation, { modifiedAt: -1 });
});
