import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');
Meteor.subscribe('announcements');
Template.header.onCreated(function () {
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);

  Meteor.subscribe('setting', {
    onReady() {
      templateInstance.currentSetting.set(ReactiveCache.getCurrentSetting());
      let currSetting = templateInstance.currentSetting.curValue;
      if (
        currSetting &&
        currSetting !== undefined &&
        currSetting.customLoginLogoImageUrl !== undefined &&
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'none';
      else if (
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'block';
      return this.stop();
    },
  });
});
Template.header.helpers({
  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },

  appIsOffline() {
    return !Meteor.status().connected;
  },

  hasAnnouncement() {
    const announcements = Announcements.findOne();
    return announcements && announcements.enabled;
  },

  announcement() {
    $('.announcement').show();
    const announcements = Announcements.findOne();
    return announcements && announcements.body;
  },

  mobileMode() {
    const sessionMode = Session.get('wekan-mobile-mode');
    if (sessionMode !== undefined) {
      return sessionMode;
    }
    return Utils.getMobileMode();
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-open-bookmarks'(evt) {
    // Already added but ensure single definition -- safe guard
  },
  'click .js-close-announcement'() {
    $('.announcement').hide();
  },
  'click .js-select-list'() {
    Session.set('currentList', this._id);
    Session.set('currentCard', null);
  },
  'click .js-toggle-desktop-drag-handles'() {
    currentUser = Meteor.user();
    if (currentUser) {
      Meteor.call('toggleDesktopDragHandles');
    } else if (window.localStorage.getItem('showDesktopDragHandles')) {
      window.localStorage.removeItem('showDesktopDragHandles');
      location.reload();
    } else {
      window.localStorage.setItem('showDesktopDragHandles', 'true');
      location.reload();
    }
  },
  'click .js-open-bookmarks'(evt) {
    // Desktop: open popup, Mobile: route to page
    if (Utils.isMiniScreen()) {
      FlowRouter.go('bookmarks');
    } else {
      Popup.open('bookmarksPopup')(evt);
    }
  },
});

Template.offlineWarning.events({
  'click a.app-try-reconnect'(event) {
    event.preventDefault();
    Meteor.reconnect();
  },
});
