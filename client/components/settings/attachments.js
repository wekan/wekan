import { ReactiveCache } from '/imports/reactiveCache';
import Attachments, { fileStoreStrategyFactory } from '/models/attachments';
const filesize = require('filesize');

BlazeComponent.extendComponent({
  subscription: null,
  showMoveAttachments: new ReactiveVar(false),
  sessionId: null,

  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  events() {
    return [
      {
        'click a.js-move-attachments': this.switchMenu,
      },
    ];
  },

  switchMenu(event) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      this.loading.set(true);
      this.showMoveAttachments.set(false);
      if (this.subscription) {
        this.subscription.stop();
      }

      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');

      if ('move-attachments' === targetID) {
        this.showMoveAttachments.set(true);
        this.subscription = Meteor.subscribe('attachmentsList', () => {
          this.loading.set(false);
        });
      }
    }
  },
}).register('attachments');

BlazeComponent.extendComponent({
  getBoardsWithAttachments() {
    this.attachments = ReactiveCache.getAttachments();
    this.attachmentsByBoardId = _.chain(this.attachments)
      .groupBy(fileObj => fileObj.meta.boardId)
      .value();

    const ret = Object.keys(this.attachmentsByBoardId)
      .map(boardId => {
        const boardAttachments = this.attachmentsByBoardId[boardId];

        _.each(boardAttachments, _attachment => {
          _attachment.flatVersion = Object.keys(_attachment.versions)
            .map(_versionName => {
              const _version = Object.assign(_attachment.versions[_versionName], {"versionName": _versionName});
              _version.storageName = fileStoreStrategyFactory.getFileStrategy(_attachment, _versionName).getStorageName();
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
  events() {
    return [
      {
        'click button.js-move-all-attachments-to-fs'(event) {
          this.attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "fs");
          });
        },
        'click button.js-move-all-attachments-to-gridfs'(event) {
          this.attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "gridfs");
          });
        },
        'click button.js-move-all-attachments-to-s3'(event) {
          this.attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "s3");
          });
        },
      }
    ]
  }
}).register('moveAttachments');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click button.js-move-all-attachments-of-board-to-fs'(event) {
          this.data().attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "fs");
          });
        },
        'click button.js-move-all-attachments-of-board-to-gridfs'(event) {
          this.data().attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "gridfs");
          });
        },
        'click button.js-move-all-attachments-of-board-to-s3'(event) {
          this.data().attachments.forEach(_attachment => {
            Meteor.call('moveAttachmentToStorage', _attachment._id, "s3");
          });
        },
      }
    ]
  },
}).register('moveBoardAttachments');

BlazeComponent.extendComponent({
  fileSize(size) {
    const ret = filesize(size);
    return ret;
  },
  events() {
    return [
      {
        'click button.js-move-storage-fs'(event) {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "fs");
        },
        'click button.js-move-storage-gridfs'(event) {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "gridfs");
        },
        'click button.js-move-storage-s3'(event) {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "s3");
        },
      }
    ]
  },
}).register('moveAttachment');
