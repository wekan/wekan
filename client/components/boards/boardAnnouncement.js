import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';

// #1566: a board's own announcement. models/lib/boardAnnouncement.js decides
// whether it shows; dismissing records the version the server reads.
const { showBoardAnnouncement } = require('/models/lib/boardAnnouncement');

Template.boardAnnouncement.helpers({
  showBoardAnnouncement() {
    const board = Utils.getCurrentBoard();
    const user = ReactiveCache.getCurrentUser();
    return showBoardAnnouncement(board, user && user.profile && user.profile.dismissedBoardAnnouncements);
  },
  boardAnnouncementBody() {
    const board = Utils.getCurrentBoard();
    return (board && board.announcement && board.announcement.body) || '';
  },
});

Template.boardAnnouncement.events({
  'click .js-close-board-announcement'(event) {
    event.preventDefault();
    const boardId = Utils.getCurrentBoardId();
    if (boardId) Meteor.call('dismissBoardAnnouncement', boardId);
  },
});

Template.boardAnnouncementPopup.onCreated(function () {
  const board = Utils.getCurrentBoard();
  this.announcementEnabled = new ReactiveVar(!!(board && board.announcement && board.announcement.enabled));
});

Template.boardAnnouncementPopup.helpers({
  announcementEnabled() { return Template.instance().announcementEnabled; },
  announcementBody() {
    const board = Utils.getCurrentBoard();
    return (board && board.announcement && board.announcement.body) || '';
  },
});

Template.boardAnnouncementPopup.events({
  'click .js-board-announcement-enabled'(event, tpl) {
    event.preventDefault();
    tpl.announcementEnabled.set(!tpl.announcementEnabled.get());
  },
  async 'submit .js-board-announcement-form'(event, tpl) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    if (!board) return;
    try {
      await board.setAnnouncement(tpl.announcementEnabled.get(), tpl.find('.js-board-announcement-text').value || '');
      Popup.back();
    } catch (error) {
      console.error('[boardAnnouncement] save failed:', error);
    }
  },
});
