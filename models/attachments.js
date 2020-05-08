import { FilesCollection } from 'meteor/ostrio:files';

const collectionName = 'attachments2';

Attachments = new FilesCollection({
  storagePath: storagePath(),
  debug: false, 
  allowClientCode: true,
  collectionName: 'attachments2',
  onAfterUpload: onAttachmentUploaded,
  onBeforeRemove: onAttachmentRemoving
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Attachments.collection._ensureIndex({ cardId: 1 });
  });

  // TODO: Permission related
  // TODO: Add Activity update

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
  Attachments.update({_id:fileRef._id}, {$set: {"meta.uploaded": true}});
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
    CFSAttachments.update(
      {
        _id: fileRef._id,
      },
      {
        $unset: {
          source: '',
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
