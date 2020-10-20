AvatarsOld = new FS.Collection('avatars', {
  stores: [new FS.Store.GridFS('avatars')],
  filter: {
    maxSize: 72000,
    allow: {
      contentTypes: ['image/*'],
    },
  },
});

function isOwner(userId, file) {
  return userId && userId === file.userId;
}

AvatarsOld.allow({
  insert: isOwner,
  update: isOwner,
  remove: isOwner,
  download() {
    return true;
  },
  fetch: ['userId'],
});

AvatarsOld.files.before.insert((userId, doc) => {
  doc.userId = userId;
});

export default AvatarsOld;
