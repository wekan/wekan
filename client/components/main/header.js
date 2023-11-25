import { ReactiveCache } from '/imports/reactiveCache';

Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');
Meteor.subscribe('announcements');
Template.header.onCreated(function(){
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);

  Meteor.subscribe('setting', {
    onReady() {
      templateInstance.currentSetting.set(ReactiveCache.getCurrentSetting());
      let currSetting = templateInstance.currentSetting.curValue;
      if(currSetting && currSetting !== undefined && currSetting.customLoginLogoImageUrl !== undefined && document.getElementById("headerIsSettingDatabaseCallDone") != null)
        document.getElementById("headerIsSettingDatabaseCallDone").style.display = 'none';
      else if(document.getElementById("headerIsSettingDatabaseCallDone") != null)
        document.getElementById("headerIsSettingDatabaseCallDone").style.display = 'block';
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
});

Template.header.events({
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-close-announcement'() {
    $('.announcement').hide();
  },
  'click .js-select-list'() {
    Session.set('currentList', this._id);
    Session.set('currentCard', null);
  },
  'click .js-toggle-desktop-drag-handles'() {
    //currentUser = Meteor.user();
    //if (currentUser) {
    //  Meteor.call('toggleDesktopDragHandles');
    //} else if (window.localStorage.getItem('showDesktopDragHandles')) {
    if (window.localStorage.getItem('showDesktopDragHandles')) {
      window.localStorage.removeItem('showDesktopDragHandles');
      location.reload();
    } else {
      window.localStorage.setItem('showDesktopDragHandles', 'true');
      location.reload();
    }
  },
});

Template.offlineWarning.events({
  'click a.app-try-reconnect'(event) {
    event.preventDefault();
    Meteor.reconnect();
  },
});
