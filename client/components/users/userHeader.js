Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.memberMenuPopup.events({
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-edit-notification': Popup.open('editNotification'),
  'click .js-logout'(evt) {
    evt.preventDefault();

    AccountsTemplates.logout();
  },
});

Template.editProfilePopup.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const fullname = tpl.find('.js-profile-fullname').value.trim();
    const username = tpl.find('.js-profile-username').value.trim();
    const initials = tpl.find('.js-profile-initials').value.trim();
    Users.update(Meteor.userId(), {$set: {
      'profile.fullname': fullname,
      'profile.initials': initials,
    }});

    if (username !== Meteor.user().username) {
      Meteor.call('setUsername', username, function(error) {
        const messageElement = tpl.$('.username-taken');
        if (error) {
         messageElement.show();
        } else {
          messageElement.hide();
          Popup.back();
        }
      });
    } else Popup.back();
  },
});

Template.editNotificationPopup.helpers({
  hasTag(tag) {
    const user = Meteor.user();
    return user && user.hasTag(tag);
  },
});

// we defined github like rules, see: https://github.com/settings/notifications
Template.editNotificationPopup.events({
  'click .js-toggle-tag-notify-participate'() {
    const user = Meteor.user();
    if (user) user.toggleTag('notify-participate');
  },
  'click .js-toggle-tag-notify-watch'() {
    const user = Meteor.user();
    if (user) user.toggleTag('notify-watch');
  },
});

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function() {
  this.find('#at-field-current_password').focus();
});

Template.changeLanguagePopup.helpers({
  languages() {
    return _.map(TAPi18n.getLanguages(), (lang, tag) => {
      const name = lang.name;
      return { tag, name };
    });
  },

  isCurrentLanguage() {
    return this.tag === TAPi18n.getLanguage();
  },
});

Template.changeLanguagePopup.events({
  'click .js-set-language'(evt) {
    Users.update(Meteor.userId(), {
      $set: {
        'profile.language': this.tag,
      },
    });
    evt.preventDefault();
  },
});
