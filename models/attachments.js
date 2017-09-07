Attachments = new FS.Collection('attachments', {
  stores: [

    // XXX Add a new store for cover thumbnails so we don't load big images in
    // the general board view
    new FS.Store.GridFS('attachments', {
      // If the uploaded document is not an image we need to enforce browser
      // download instead of execution. This is particularly important for HTML
      // files that the browser will just execute if we don't serve them with the
      // appropriate `application/octet-stream` MIME header which can lead to user
      // data leaks. I imagine other formats (like PDF) can also be attack vectors.
      // See https://github.com/wekan/wekan/issues/99
      // XXX Should we use `beforeWrite` option of CollectionFS instead of
      // collection-hooks?
      // We should use `beforeWrite`.
      beforeWrite: (fileObj) => {
        if (!fileObj.isImage()) {
          return {
            type: 'application/octet-stream',
          };
        }
        return {};
      },
    }),
  ],
});

if (Meteor.isServer) {
  Attachments.allow({
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

// XXX Enforce a schema for the Attachments CollectionFS

if (Meteor.isServer) {
  Attachments.files.after.insert((userId, doc) => {
    // If the attachment doesn't have a source field
    // or its source is different than import
    if (!doc.source || doc.source !== 'import') {
      // Add activity about adding the attachment
      Activities.insert({
        userId,
        type: 'card',
        activityType: 'addAttachment',
        attachmentId: doc._id,
        boardId: doc.boardId,
        cardId: doc.cardId,
      });
    } else {
      // Don't add activity about adding the attachment as the activity
      // be imported and delete source field
      Attachments.update( {_id: doc._id}, {$unset: { source : '' } } );
    }
  });

  Attachments.files.after.remove((userId, doc) => {
    Activities.remove({
      attachmentId: doc._id,
    });
  });
}
