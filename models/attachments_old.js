const storeName = 'attachments';
const defaultStoreOptions = {
  beforeWrite: fileObj => {
    if (!fileObj.isImage()) {
      return {
        type: 'application/octet-stream',
      };
    }
    return {};
  },
};
let store;
store = new FS.Store.GridFS(storeName, {
  // XXX Add a new store for cover thumbnails so we don't load big images in
  // the general board view
  // If the uploaded document is not an image we need to enforce browser
  // download instead of execution. This is particularly important for HTML
  // files that the browser will just execute if we don't serve them with the
  // appropriate `application/octet-stream` MIME header which can lead to user
  // data leaks. I imagine other formats (like PDF) can also be attack vectors.
  // See https://github.com/wekan/wekan/issues/99
  // XXX Should we use `beforeWrite` option of CollectionFS instead of
  // collection-hooks?
  // We should use `beforeWrite`.
  ...defaultStoreOptions,
});
AttachmentsOld = new FS.Collection('attachments', {
  stores: [store],
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    AttachmentsOld.files._ensureIndex({ cardId: 1 });
  });

  AttachmentsOld.allow({
    insert(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    update(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    remove(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    // We authorize the attachment download either:
    // - if the board is public, everyone (even unconnected) can download it
    // - if the board is private, only board members can download it
    download(userId, doc) {
      const board = Boards.findOne(doc.boardId);
      if (board.isPublic()) {
        return true;
      } else {
        return board.hasMember(userId);
      }
    },

    fetch: ['boardId'],
  });
}

// XXX Enforce a schema for the AttachmentsOld CollectionFS

if (Meteor.isServer) {
  AttachmentsOld.files.after.insert((userId, doc) => {
    // If the attachment doesn't have a source field
    // or its source is different than import
    if (!doc.source || doc.source !== 'import') {
      // Add activity about adding the attachment
      Activities.insert({
        userId,
        type: 'card',
        activityType: 'addAttachment',
        attachmentId: doc._id,
        // this preserves the name so that notifications can be meaningful after
        // this file is removed
        attachmentName: doc.original.name,
        boardId: doc.boardId,
        cardId: doc.cardId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    } else {
      // Don't add activity about adding the attachment as the activity
      // be imported and delete source field
      AttachmentsOld.update(
        {
          _id: doc._id,
        },
        {
          $unset: {
            source: '',
          },
        },
      );
    }
  });

  AttachmentsOld.files.before.remove((userId, doc) => {
    Activities.insert({
      userId,
      type: 'card',
      activityType: 'deleteAttachment',
      attachmentId: doc._id,
      // this preserves the name so that notifications can be meaningful after
      // this file is removed
      attachmentName: doc.original.name,
      boardId: doc.boardId,
      cardId: doc.cardId,
      listId: doc.listId,
      swimlaneId: doc.swimlaneId,
    });
  });
}

export default AttachmentsOld;
