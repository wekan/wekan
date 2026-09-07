import Translation from '/models/translation';
import securityLog from '/server/lib/securityLog';

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

Translation.deny({
  async insert(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'TranslationBleed',
      action: 'blocked', source: 'Translation DDP insert', userId,
      detail: 'refused direct insertion of a translation override' });
    return true;
  },
  async update(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'TranslationBleed',
      action: 'blocked', source: 'Translation DDP update', userId,
      detail: 'refused direct update of a translation override' });
    return true;
  },
  async remove(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'TranslationBleed',
      action: 'blocked', source: 'Translation DDP remove', userId,
      detail: 'refused direct removal of a translation override' });
    return true;
  },
});
