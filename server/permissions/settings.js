import Settings from '/models/settings';

Settings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});

const GUARDED_PWA_FIELDS = new Set([
  'customHeadEnabled', 'customHeadMetaTags', 'customHeadLinkTags',
  'customManifestEnabled', 'customManifestContent',
  'customAssetLinksEnabled', 'customAssetLinksContent',
]);

Settings.deny({
  update(userId, doc, fields) {
    return fields.some(field => GUARDED_PWA_FIELDS.has(field));
  },
});
