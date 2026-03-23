import { ReactiveCache } from '/imports/reactiveCache';
import { groupBy } from '/imports/lib/collectionHelpers';
import Attachments from '/models/attachments';
const { filesize } = require('filesize');

Template.attachments.onCreated(function () {
  this.subscription = null;
  this.showMoveAttachments = new ReactiveVar(false);
  this.sessionId = null;
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
});

Template.attachments.helpers({
  loading() {
    return Template.instance().loading;
  },
  showMoveAttachments() {
    return Template.instance().showMoveAttachments;
  },
});

Template.attachments.events({
  'click a.js-move-attachments'(event, tpl) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      tpl.loading.set(true);
      tpl.showMoveAttachments.set(false);
      if (tpl.subscription) {
        tpl.subscription.stop();
      }

      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');

      if ('move-attachments' === targetID) {
        tpl.showMoveAttachments.set(true);
        tpl.subscription = Meteor.subscribe('attachmentsList', () => {
          tpl.loading.set(false);
        });
      }
    }
  },
});

Template.moveAttachments.onCreated(function () {
  this.attachments = null;
});

Template.moveAttachments.helpers({
  getBoardsWithAttachments() {
    const tpl = Template.instance();
    tpl.attachments = ReactiveCache.getAttachments();
    const attachmentsByBoardId = groupBy(tpl.attachments, fileObj => fileObj.meta.boardId);

    const ret = Object.keys(attachmentsByBoardId)
      .map(boardId => {
        const boardAttachments = attachmentsByBoardId[boardId];

        boardAttachments.forEach(_attachment => {
          _attachment.flatVersion = Object.keys(_attachment.versions)
            .map(_versionName => {
              const _version = Object.assign(_attachment.versions[_versionName], {"versionName": _versionName});
              // Read storage directly from the document (set by onAfterUpload on server)
              _version.storageName = _version.storage || (
                (_attachment.meta?.source === 'import' || _version.meta?.gridFsFileId) ? 'gridfs' : 'fs'
              );
              return _version;
            });
        });
        const board = ReactiveCache.getBoard(boardId);
        board.attachments = boardAttachments;
        return board;
      })
    return ret;
  },
  getBoardData(boardid) {
    const ret = ReactiveCache.getBoard(boardId);
    return ret;
  },
});

Template.moveAttachments.events({
  'click button.js-move-all-attachments-to-fs'(event, tpl) {
    tpl.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "fs");
    });
  },
  'click button.js-move-all-attachments-to-gridfs'(event, tpl) {
    tpl.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "gridfs");
    });
  },
  'click button.js-move-all-attachments-to-s3'(event, tpl) {
    tpl.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "s3");
    });
  },
});

Template.moveBoardAttachments.events({
  'click button.js-move-all-attachments-of-board-to-fs'() {
    const data = Template.currentData();
    data.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "fs");
    });
  },
  'click button.js-move-all-attachments-of-board-to-gridfs'() {
    const data = Template.currentData();
    data.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "gridfs");
    });
  },
  'click button.js-move-all-attachments-of-board-to-s3'() {
    const data = Template.currentData();
    data.attachments.forEach(_attachment => {
      Meteor.call('moveAttachmentToStorage', _attachment._id, "s3");
    });
  },
});

Template.moveAttachment.helpers({
  fileSize(size) {
    const ret = filesize(size);
    return ret;
  },
});

Template.moveAttachment.events({
  'click button.js-move-storage-fs'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "fs");
  },
  'click button.js-move-storage-gridfs'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "gridfs");
  },
  'click button.js-move-storage-s3'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "s3");
  },
});
