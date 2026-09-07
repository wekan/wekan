import Translation from '/models/translation';

Translation.allow({
  async insert(userId, doc) {
    const user = await Meteor.users.findOneAsync(userId);
    if (user?.isAdmin)
      return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  async update(userId, doc) {
    const user = await Meteor.users.findOneAsync(userId);
    if (user?.isAdmin)
      return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  async remove(userId, doc) {
    const user = await Meteor.users.findOneAsync(userId);
    if (user?.isAdmin)
      return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  fetch: [],
});
