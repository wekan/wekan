import Users from '/models/users';
const { SAVED_SEARCH_LIMIT, normalizeSavedSearch } = require('/models/lib/savedSearch');

Meteor.methods({
  async 'savedSearches.add'(input) {
    check(input, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const normalized = normalizeSavedSearch(input);
    if (normalized.error) throw new Meteor.Error(normalized.error);
    const user = await Users.findOneAsync(
      { _id: this.userId },
      { fields: { 'profile.savedSearches': 1 } },
    );
    const saved = user?.profile?.savedSearches || [];
    if (saved.length >= SAVED_SEARCH_LIMIT) {
      throw new Meteor.Error('saved-search-limit-reached');
    }
    const item = {
      _id: Random.id(),
      ...normalized.value,
      createdAt: new Date(),
    };
    await Users.updateAsync(
      { _id: this.userId },
      { $push: { 'profile.savedSearches': item } },
    );
    return item;
  },

  async 'savedSearches.remove'(savedSearchId) {
    check(savedSearchId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await Users.updateAsync(
      { _id: this.userId },
      { $pull: { 'profile.savedSearches': { _id: savedSearchId } } },
    );
  },
});
