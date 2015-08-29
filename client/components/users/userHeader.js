Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar')
});

Template.memberMenuPopup.events({
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-logout': function(evt) {
    evt.preventDefault();

    AccountsTemplates.logout();
  }
});

Template.editProfilePopup.events({
  submit: function(evt, tpl) {
    evt.preventDefault();
    var fullname = $.trim(tpl.find('.js-profile-fullname').value);
    var username = $.trim(tpl.find('.js-profile-username').value);
    var initials = $.trim(tpl.find('.js-profile-initials').value);
    Users.update(Meteor.userId(), {$set: {
      'profile.fullname': fullname,
      'profile.initials': initials
    }});
    // XXX We should report the error to the user.
    if (username !== Meteor.user().username) {
      Meteor.call('setUsername', username);
    }
    Popup.back();
  }
});

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function() {
  this.find('#at-field-current_password').focus();
});

Template.changeLanguagePopup.helpers({
  languages: function() {
    return _.map(TAPi18n.getLanguages(), function(lang, tag) {
      return {
        tag: tag,
        name: lang.name
      };
    });
  },
  isCurrentLanguage: function() {
    return this.tag === TAPi18n.getLanguage();
  }
});

Template.changeLanguagePopup.events({
  'click .js-set-language': function(evt) {
    Users.update(Meteor.userId(), {
      $set: {
        'profile.language': this.tag
      }
    });
    evt.preventDefault();
  }
});
