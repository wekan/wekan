import { FilesCollection } from 'meteor/ostrio:files';
const fs = require('fs');

const collectionName = 'attachments2';

Attachments = new FilesCollection({
  storagePath: storagePath(),
  debug: false, 
//  allowClientCode: true,
  collectionName: 'attachments2',
  onAfterUpload: onAttachmentUploaded,
  onBeforeRemove: onAttachmentRemoving
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Attachments.collection._ensureIndex({ cardId: 1 });
  });

  // TODO: Permission related
  Attachments.allow({
    insert() {
      return false;
    },
    update() {
      return true;
    },
    remove() {
      return true;
    }
  });

  Meteor.methods({
    cloneAttachment(file, overrides) {
      check(file, Object);
      check(overrides, Match.Maybe(Object));
      const path = file.path;
      const opts = {
          fileName: file.name,
          type: file.type,
          meta: file.meta,
          userId: file.userId
      };
      for (let key in overrides) {
        if (key === 'meta') {
          for (let metaKey in overrides.meta) {
            opts.meta[metaKey] = overrides.meta[metaKey];
          }
        } else {
          opts[key] = overrides[key];
        }
      }
      const buffer = fs.readFileSync(path);
      Attachments.write(buffer, opts, (err, fileRef) => {
        if (err) {
          console.log('Error when cloning record', err);
        }
      });
      return true;
    }
  });

  Meteor.publish(collectionName, function() {
    return Attachments.find().cursor;
  });
} else {
  Meteor.subscribe(collectionName);
}

function storagePath(defaultPath) {
  const storePath = process.env.ATTACHMENTS_STORE_PATH;
  return storePath ? storePath : defaultPath;
}

function onAttachmentUploaded(fileRef) {
  Attachments.update({_id:fileRef._id}, {$set: {"meta.uploading": false}});
  if (!fileRef.meta.source || fileRef.meta.source !== 'import') {
    // Add activity about adding the attachment
    Activities.insert({
      userId: fileRef.userId,
      type: 'card',
      activityType: 'addAttachment',
      attachmentId: fileRef._id,
      // this preserves the name so that notifications can be meaningful after
      // this file is removed 
      attachmentName: fileRef.name,
      boardId: fileRef.meta.boardId,
      cardId: fileRef.meta.cardId,
      listId: fileRef.meta.listId,
      swimlaneId: fileRef.meta.swimlaneId,
    });
  } else {
    // Don't add activity about adding the attachment as the activity
    // be imported and delete source field
    Attachments.collection.update(
      {
        _id: fileRef._id,
      },
      {
        $unset: {
          'meta.source': '',
        },
      },
    );
  }
}

function onAttachmentRemoving(cursor) {
  const file = cursor.get()[0];
  const meta = file.meta;
  Activities.insert({
    userId: this.userId,
    type: 'card',
    activityType: 'deleteAttachment',
    attachmentId: file._id,
    // this preserves the name so that notifications can be meaningful after
    // this file is removed
    attachmentName: file.name,
    boardId: meta.boardId,
    cardId: meta.cardId,
    listId: meta.listId,
    swimlaneId: meta.swimlaneId,
  });
  return true;
}

export default Attachments;
