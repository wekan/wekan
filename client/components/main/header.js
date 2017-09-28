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
    const notice =  Notices.findOne();
    return notice && notice.enabled;
  },

  announcement() {
    $('.announcement').show();
    const notice =  Notices.findOne();
    return notice && notice.body;
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-close-announcement'() {
    $('.announcement').hide();
  },
});
