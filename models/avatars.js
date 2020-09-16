import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './lib/grid/createBucket';
import { createOnAfterUpload } from './lib/fsHooks/createOnAfterUpload';
import { createInterceptDownload } from './lib/fsHooks/createInterceptDownload';
import { createOnAfterRemove } from './lib/fsHooks/createOnAfterRemove';

let avatarsBucket;
if (Meteor.isServer) {
  avatarsBucket = createBucket('avatars');
}

Avatars = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'avatars',
  allowClientCode: true,
  onBeforeUpload(file) {
    if (file.size <= 72000 && file.isImage) return true;
    return 'Please upload image, with size equal or less than 72KB';
  },
  onAfterUpload: createOnAfterUpload(avatarsBucket),
  interceptDownload: createInterceptDownload(avatarsBucket),
  onAfterRemove: createOnAfterRemove(avatarsBucket),
});

function isOwner(userId, doc) {
  return userId && userId === doc.userId;
}

if (Meteor.isServer) {
  Avatars.allow({
    insert: isOwner,
    update: isOwner,
    remove: isOwner,
    fetch: ['userId'],
  });
}

export default Avatars;
