Avatars = new FileCollection('avatars', {
  resumable: true,
  resumableIndexName: 'ava_resume',
  http: [{
    method: 'get',
    path: '/:md5',
    lookup: ({ md5 }) => ({ md5 })
  }]
});

console.warn('[re-attach] Avatar size & type filters disabled!');
/*
  filter: {
    maxSize: 72000,
    allow: {
      contentTypes: ['image/*'],
    },
  },
*/

if (Meteor.isServer) {
  function isOwner(userId, file) {
    return userId && userId === file.metadata.userId;
  }

  Avatars.allow({
    insert: isOwner,
    remove: isOwner,
    read: () => true,
    write: isOwner,
  });
}

Avatars.before.insert((userId, file) => {
  if (!file.metadata) file.metadata = { userId };
  else file.metadata.userId = userId;
});
