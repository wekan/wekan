Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.memberMenuPopup.helpers({
  templatesBoardId() {
    return Meteor.user().getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return Meteor.user().getTemplatesBoardSlug();
  },
});

Template.memberMenuPopup.events({
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-settings': Popup.open('changeSettings'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-logout'(event) {
    event.preventDefault();

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
  allowUserDelete() {
    return AccountSettings.findOne('accounts-allowUserDelete').booleanValue;
  },
});

Template.editProfilePopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const username = templateInstance.find('.js-profile-username').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    let isChangeUserName = false;
    let isChangeEmail = false;
    Users.update(Meteor.userId(), {
      $set: {
        'profile.fullname': fullname,
        'profile.initials': initials,
      },
    });
    isChangeUserName = username !== Meteor.user().username;
    isChangeEmail =
      email.toLowerCase() !== Meteor.user().emails[0].address.toLowerCase();
    if (isChangeUserName && isChangeEmail) {
      Meteor.call(
        'setUsernameAndEmail',
        username,
        email.toLowerCase(),
        Meteor.userId(),
        function(error) {
          const usernameMessageElement = templateInstance.$('.username-taken');
          const emailMessageElement = templateInstance.$('.email-taken');
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
        },
      );
    } else if (isChangeUserName) {
      Meteor.call('setUsername', username, Meteor.userId(), function(error) {
        const messageElement = templateInstance.$('.username-taken');
        if (error) {
          messageElement.show();
        } else {
          messageElement.hide();
          Popup.back();
        }
      });
    } else if (isChangeEmail) {
      Meteor.call('setEmail', email.toLowerCase(), Meteor.userId(), function(
        error,
      ) {
        const messageElement = templateInstance.$('.email-taken');
        if (error) {
          messageElement.show();
        } else {
          messageElement.hide();
          Popup.back();
        }
      });
    } else Popup.back();
  },
  'click #deleteButton': Popup.afterConfirm('userDelete', function() {
    Popup.close();
    Users.remove(Meteor.userId());
    AccountsTemplates.logout();
  }),
});

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function() {
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
      } else if (lang.name === 'oc') {
        name = 'Occitan';
      }
      return { tag, name };
    }).sort(function(a, b) {
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
  'click .js-set-language'(event) {
    Users.update(Meteor.userId(), {
      $set: {
        'profile.language': this.tag,
      },
    });
    event.preventDefault();
  },
});

Template.changeSettingsPopup.helpers({
  showDesktopDragHandles() {
    return Meteor.user().hasShowDesktopDragHandles();
  },
  hiddenSystemMessages() {
    return Meteor.user().hasHiddenSystemMessages();
  },
  showCardsCountAt() {
    return Meteor.user().getLimitToShowCardsCount();
  },
});

Template.changeSettingsPopup.events({
  'click .js-toggle-desktop-drag-handles'() {
    Meteor.call('toggleDesktopDragHandles');
  },
  'click .js-toggle-system-messages'() {
    Meteor.call('toggleSystemMessages');
  },
  'click .js-apply-show-cards-at'(event, templateInstance) {
    event.preventDefault();
    const minLimit = parseInt(
      templateInstance.$('#show-cards-count-at').val(),
      10,
    );
    if (!isNaN(minLimit)) {
      Meteor.call('changeLimitToShowCardsCount', minLimit);
      Popup.back();
    }
  },
});
