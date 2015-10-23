Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.memberMenuPopup.events({
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-logout'(evt) {
    evt.preventDefault();

    AccountsTemplates.logout();
  },
});

Template.editProfilePopup.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const fullname = $.trim(tpl.find('.js-profile-fullname').value);
    const username = $.trim(tpl.find('.js-profile-username').value);
    const initials = $.trim(tpl.find('.js-profile-initials').value);
    Users.update(Meteor.userId(), {$set: {
      'profile.fullname': fullname,
      'profile.initials': initials,
    }});
    // XXX We should report the error to the user.
    if (username !== Meteor.user().username) {
      Meteor.call('setUsername', username);
    }
    Popup.back();
  },
});

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function() {
  this.find('#at-field-current_password').focus();
});

Template.changeLanguagePopup.helpers({
  languages() {
    return TAPi18n.getLanguages().map((lang, tag) => {
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
