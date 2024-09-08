import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';

if (Meteor.isServer) {
  AvatarsOld = createBucket('cfs_gridfs.avatars');

/*

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

*/

};

export default AvatarsOld;
