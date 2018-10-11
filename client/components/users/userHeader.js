Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.memberMenuPopup.events({
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-settings': Popup.open('changeSettings'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-logout'(evt) {
    evt.preventDefault();

    AccountsTemplates.logout();
  },
  'click .js-go-setting'() {
    Popup.close();
  },
});

Template.editProfilePopup.helpers({
  allowEmailChange() {
    return AccountSettings.findOne('accounts-allowEmailChange').booleanValue;
  },
  allowUserNameChange() {
    return AccountSettings.findOne('accounts-allowUserNameChange').booleanValue;
  },
});

Template.editProfilePopup.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const fullname = tpl.find('.js-profile-fullname').value.trim();
    const username = tpl.find('.js-profile-username').value.trim();
    const initials = tpl.find('.js-profile-initials').value.trim();
    const email = tpl.find('.js-profile-email').value.trim();
    let isChangeUserName = false;
    let isChangeEmail = false;
    Users.update(Meteor.userId(), {
      $set: {
        'profile.fullname': fullname,
        'profile.initials': initials,
      },
    });
    isChangeUserName = username !== Meteor.user().username;
    isChangeEmail = email.toLowerCase() !== Meteor.user().emails[0].address.toLowerCase();
    if (isChangeUserName && isChangeEmail) {
      Meteor.call('setUsernameAndEmail', username, email.toLowerCase(), Meteor.userId(), function (error) {
        const usernameMessageElement = tpl.$('.username-taken');
        const emailMessageElement = tpl.$('.email-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
            emailMessageElement.hide();
          } else if (errorElement === 'email-already-taken') {
            usernameMessageElement.hide();
            emailMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          emailMessageElement.hide();
          Popup.back();
        }
      });
    } else if (isChangeUserName) {
      Meteor.call('setUsername', username, Meteor.userId(), function (error) {
        const messageElement = tpl.$('.username-taken');
        if (error) {
          messageElement.show();
        } else {
          messageElement.hide();
          Popup.back();
        }
      });
    } else if (isChangeEmail) {
      Meteor.call('setEmail', email.toLowerCase(), Meteor.userId(), function (error) {
        const messageElement = tpl.$('.email-taken');
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

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function () {
  this.find('#at-field-current_password').focus();
});

Template.changeLanguagePopup.helpers({
  languages() {
    return _.map(TAPi18n.getLanguages(), (lang, code) => {
      // Same code in /client/components/main/layouts.js
      // TODO : Make code reusable
      const tag = code;
      let name = lang.name;
      if (lang.name === 'br') {
        name = 'Brezhoneg';
      } else if (lang.name === 'ig') {
        name = 'Igbo';
      }
      return { tag, name };
    }).sort(function (a, b) {
      if (a.name === b.name) {
        return 0;
      } else {
        return a.name > b.name ? 1 : -1;
      }
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

Template.changeSettingsPopup.helpers({
  hiddenSystemMessages() {
    return Meteor.user().hasHiddenSystemMessages();
  },
  showCardsCountAt() {
    return Meteor.user().getLimitToShowCardsCount();
  },
});

Template.changeSettingsPopup.events({
  'click .js-toggle-system-messages'() {
    Meteor.call('toggleSystemMessages');
  },
  'click .js-apply-show-cards-at'(evt, tpl) {
    evt.preventDefault();
    const minLimit = parseInt(tpl.$('#show-cards-count-at').val(), 10);
    if (!isNaN(minLimit)) {
      Meteor.call('changeLimitToShowCardsCount', minLimit);
      Popup.back();
    }
  },
});
