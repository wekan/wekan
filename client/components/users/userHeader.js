import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
  },
}).register('memberMenuPopup');

Template.memberMenuPopup.helpers({
  templatesBoardId() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getTemplatesBoardId();
    } else {
      // No need to getTemplatesBoardId on public board
      return false;
    }
  },
  templatesBoardSlug() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getTemplatesBoardSlug();
    } else {
      // No need to getTemplatesBoardSlug() on public board
      return false;
    }
  },
  isSameDomainNameSettingValue(){
    const currSett = ReactiveCache.getCurrentSetting();
    if(currSett && currSett != undefined && currSett.disableRegistration && currSett.mailDomainName !== undefined && currSett.mailDomainName != ""){
      currentUser = ReactiveCache.getCurrentUser();
      if (currentUser) {
        let found = false;
        for(let i = 0; i < currentUser.emails.length; i++) {
          if(currentUser.emails[i].address.endsWith(currSett.mailDomainName)){
            found = true;
            break;
          }
        }
        return found;
      } else {
        return true;
      }
    }
    else
      return false;
  },
  isNotOAuth2AuthenticationMethod(){
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.authenticationMethod.toLowerCase() != 'oauth2';
    } else {
      return true;
    }
  }
});

Template.memberMenuPopup.events({
  'click .js-my-cards'() {
    Popup.back();
  },
  'click .js-due-cards'() {
    Popup.back();
  },
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
  'click .js-invite-people': Popup.open('invitePeople'),
  'click .js-edit-profile': Popup.open('editProfile'),
  'click .js-change-settings': Popup.open('changeSettings'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-support': Popup.open('support'),
  'click .js-logout'(event) {
    event.preventDefault();

    AccountsTemplates.logout();
  },
  'click .js-go-setting'() {
    Popup.back();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
  },
}).register('editProfilePopup');

Template.invitePeoplePopup.events({
  'click a.js-toggle-board-choose'(event){
    let target = $(event.target);
    if (!target.hasClass('js-toggle-board-choose')) {
      target = target.parent();
    }
    const checkboxId = target.attr('id');
    $(`#${checkboxId} .materialCheckBox`).toggleClass('is-checked');
    $(`#${checkboxId}`).toggleClass('is-checked');
  },
  'click button.js-email-invite'(event){
    const emails = $('#email-to-invite')
      .val()
      .toLowerCase()
      .trim()
      .split('\n')
      .join(',')
      .split(',');
    const boardsToInvite = [];
    $('.js-toggle-board-choose .materialCheckBox.is-checked').each(function() {
      boardsToInvite.push($(this).data('id'));
    });
    const validEmails = [];
    emails.forEach(email => {
      if (email && SimpleSchema.RegEx.Email.test(email.trim())) {
        validEmails.push(email.trim());
      }
    });
    if (validEmails.length) {
      Meteor.call('sendInvitation', validEmails, boardsToInvite, (_, rc) => {
        if (rc == 0) {
          let divInfos = document.getElementById("invite-people-infos");
          if(divInfos && divInfos !== undefined){
            divInfos.innerHTML = "<span style='color: green'>" + TAPi18n.__('invite-people-success') + "</span>";
          }
        }
        else{
          let divInfos = document.getElementById("invite-people-infos");
          if(divInfos && divInfos !== undefined){
            divInfos.innerHTML = "<span style='color: red'>" + TAPi18n.__('invite-people-error') + "</span>";
          }
        }
        // Popup.close();
      });
    }
  },
});

Template.editProfilePopup.helpers({
  allowEmailChange() {
    Meteor.call('AccountSettings.allowEmailChange', (_, result) => {
      if (result) {
        return true;
      } else {
        return false;
      }
    });
  },
  allowUserNameChange() {
    Meteor.call('AccountSettings.allowUserNameChange', (_, result) => {
      if (result) {
        return true;
      } else {
        return false;
      }
    });
  },
  allowUserDelete() {
    Meteor.call('AccountSettings.allowUserDelete', (_, result) => {
      if (result) {
        return true;
      } else {
        return false;
      }
    });
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
    isChangeUserName = username !== ReactiveCache.getCurrentUser().username;
    isChangeEmail =
      email.toLowerCase() !== ReactiveCache.getCurrentUser().emails[0].address.toLowerCase();
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
    Popup.back();
    Users.remove(Meteor.userId());
    AccountsTemplates.logout();
  }),
});

// XXX For some reason the useraccounts autofocus isnt working in this case.
// See https://github.com/meteor-useraccounts/core/issues/384
Template.changePasswordPopup.onRendered(function() {
  $('.at-pwd-form').show();
  this.find('#at-field-current_password').focus();
});

Template.changeLanguagePopup.helpers({
  languages() {
    return TAPi18n.getSupportedLanguages()
      .map(({ tag, name }) => ({ tag: tag, name }))
      .sort((a, b) => {
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
    TAPi18n.setLanguage(this.tag);
    event.preventDefault();
  },
});

Template.changeSettingsPopup.helpers({
  rescueCardDescription() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).rescueCardDescription;
    } else if (window.localStorage.getItem('rescueCardDescription')) {
      return true;
    } else {
      return false;
    }
  },
  showCardsCountAt() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getLimitToShowCardsCount();
    } else {
      return window.localStorage.getItem('limitToShowCardsCount');
    }
  },
  weekDays(startDay) {
    return [
      TAPi18n.__('sunday'),
      TAPi18n.__('monday'),
      TAPi18n.__('tuesday'),
      TAPi18n.__('wednesday'),
      TAPi18n.__('thursday'),
      TAPi18n.__('friday'),
      TAPi18n.__('saturday'),
    ].map(function(day, index) {
      return { name: day, value: index, isSelected: index === startDay };
    });
  },
  startDayOfWeek() {
    currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getStartDayOfWeek();
    } else {
      return window.localStorage.getItem('startDayOfWeek');
    }
  },
});

Template.changeSettingsPopup.events({
  'keypress/paste #show-cards-count-at'() {
    let keyCode = event.keyCode;
    let charCode = String.fromCharCode(keyCode);
    let regex = new RegExp('[-0-9]');
    let ret = regex.test(charCode);
    return ret;
  },
  'click .js-toggle-desktop-drag-handles'() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      Meteor.call('toggleDesktopDragHandles');
    } else if (window.localStorage.getItem('showDesktopDragHandles')) {
      window.localStorage.removeItem('showDesktopDragHandles');
    } else {
      window.localStorage.setItem('showDesktopDragHandles', 'true');
    }
  },
  'click .js-rescue-card-description'() {
    Meteor.call('toggleRescueCardDescription')
    },
  'click .js-apply-user-settings'(event, templateInstance) {
    event.preventDefault();
    let minLimit = parseInt(
      templateInstance.$('#show-cards-count-at').val(),
      10,
    );
    const startDay = parseInt(
      templateInstance.$('#start-day-of-week').val(),
      10,
    );
    const currentUser = ReactiveCache.getCurrentUser();
    if (isNaN(minLimit) || minLimit < -1) {
      minLimit = -1;
    }
    if (!isNaN(minLimit)) {
      if (currentUser) {
        Meteor.call('changeLimitToShowCardsCount', minLimit);
      } else {
        window.localStorage.setItem('limitToShowCardsCount', minLimit);
      }
    }
    if (!isNaN(startDay)) {
      if (currentUser) {
        Meteor.call('changeStartDayOfWeek', startDay);
      } else {
        window.localStorage.setItem('startDayOfWeek', startDay);
      }
    }
    Popup.back();
  },
});
