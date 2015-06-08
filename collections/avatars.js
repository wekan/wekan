Avatars = new FS.Collection('avatars', {
  stores: [
    new FS.Store.GridFS('avatars')
  ],
  filter: {
    maxSize: 32000,
    allow: {
      contentTypes: ['image/*']
    }
  }
});

var isOwner = function(userId, file) {
  return userId && userId === file.userId;
};

Avatars.allow({
  insert: isOwner,
  update: isOwner,
  remove: isOwner,
  download: function() { return true; },
  fetch: ['userId']
});

Avatars.files.before.insert(function(userId, doc) {
  doc.userId = userId;
});
