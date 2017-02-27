Attachments = new FileCollection('attachments', {
  resumable: true,
  resumableIndexName: 'att_resume',
  http: [{
    method: 'get',
    path: '/:md5',
    lookup: ({ md5 }) => ({ md5 })
  }]
});

if (Meteor.isServer) {
  Attachments.allow({
    insert(userId, { metadata }) {
      if (!metadata) return false;
      if (!metadata.userId) metadata.userId = userId;
      return allowIsBoardMember(userId, Boards.findOne(metadata.boardId));
    },
    remove(userId, { metadata }) {
      return metadata && allowIsBoardMember(userId, Boards.findOne(metadata.boardId));
    },
    read(userId, { metadata }) {
      return metadata && Boolean(Boards.findOne(metadata.boardId, {
        $or: [
          { 'members.userId': userId },
          { permission: 'public' },
        ]
      }));
    },
    write(userId, { metadata }) {
      return metadata && metadata.userId && allowIsBoardMember(userId, Boards.findOne(metadata.boardId));
    },
  });

  Attachments.after.insert((userId, { _id, metadata }) => {
    Activities.insert({
      userId,
      type: 'card',
      activityType: 'addAttachment',
      attachmentId: _id,
      boardId: metadata.boardId,
      cardId: metadata.cardId,
    });
  });

  Attachments.after.remove((userId, { _id }) => {
    Activities.remove({
      attachmentId: _id,
    });
  });
}

console.warn('[re-attach] Upload file type "fix" disabled!');
/*
Attachments.files.before.insert((userId, doc) => {
  const file = new FS.File(doc);
  doc.userId = userId;

  // If the uploaded document is not an image we need to enforce browser
  // download instead of execution. This is particularly important for HTML
  // files that the browser will just execute if we don't serve them with the
  // appropriate `application/octet-stream` MIME header which can lead to user
  // data leaks. I imagine other formats (like PDF) can also be attack vectors.
  // See https://github.com/wekan/wekan/issues/99
  // XXX Should we use `beforeWrite` option of CollectionFS instead of
  // collection-hooks?
  if (!file.isImage()) {
    file.original.type = 'application/octet-stream';
  }
});
*/

if (Meteor.isClient) Meteor.startup(() => {
  Attachments.resumable.on('fileAdded', file => {
    const boardId = Session.get('currentBoard');
    const cardId = Session.get('currentCard');
    if (!boardId || !cardId) throw new Error(`Active board <${boardId}> & card <${cardId}> required for upload!`);
    Attachments.insert({
      _id: file.uniqueIdentifier,
      filename: file.fileName,
      contentType: file.file.type,
      metadata: { boardId, cardId }
    }, (err) => {
      if (err) return console.warn('Upload failed', err);
      Attachments.resumable.upload();
      Popup.close();
      Session.set('lastModifiedCard', cardId);
    });
  });

  Attachments.resumable.on('fileProgress', (file) => {
    console.log('[re-attach] Upload progress', file.progress(), file);
  });

  Attachments.resumable.on('fileSuccess', (file, msg) => {
    console.log('[re-attach] Upload success', msg, file);
  });

  Attachments.resumable.on('fileError', (file, msg) => {
    console.warn('[re-attach] Upload error:', msg, file);
  });

  // required for file-collection authentication of write() events
  Tracker.autorun(() => {
    document.cookie = `X-Auth-Token=${Accounts._storedLoginToken()}; path=/`;
  });
});
