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
    currentUser = Meteor.user();
    if (currentUser) {
      return Meteor.user().getTemplatesBoardId();
    } else {
      // No need to getTemplatesBoardId on public board
      return false;
    }
  },
  templatesBoardSlug() {
    currentUser = Meteor.user();
    if (currentUser) {
      return Meteor.user().getTemplatesBoardSlug();
    } else {
      // No need to getTemplatesBoardSlug() on public board
      return false;
    }
  },
  isSameDomainNameSettingValue(){
    const currSett = Settings.findOne();
    if(currSett && currSett != undefined && currSett.disableRegistration && currSett.mailDomainName !== undefined && currSett.mailDomainName != ""){
      currentUser = Meteor.user();
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
    currentUser = Meteor.user();
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

Template.invitePeoplePopup.helpers({
  currentSetting() {
    return Settings.findOne();
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
    Popup.back();
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
      } else if (lang.name === 'ar-EG') {
        // ar-EG = Arabic (Egypt), simply Masri (مَصرى, [ˈmɑsˤɾi], Egyptian, Masr refers to Cairo)
        name = 'مَصرى';
      } else if (lang.name === 'de-CH') {
        name = 'Deutsch (Schweiz)';
      } else if (lang.name === 'de-AT') {
        name = 'Deutsch (Österreich)';
      } else if (lang.name === 'en-DE') {
        name = 'English (Germany)';
      } else if (lang.name === 'et-EE') {
        name = 'eesti keel (Eesti)';
      } else if (lang.name === 'fa-IR') {
        // fa-IR = Persian (Iran)
        name = 'فارسی/پارسی (ایران‎)';
      } else if (lang.name === 'fr-BE') {
        name = 'Français (Belgique)';
      } else if (lang.name === 'fr-CA') {
        name = 'Français (Canada)';
      } else if (lang.name === 'fr-CH') {
        name = 'Français (Schweiz)';
      } else if (lang.name === 'gu-IN') {
        // gu-IN = Gurajati (India)
        name = 'ગુજરાતી';
      } else if (lang.name === 'hi-IN') {
        // hi-IN = Hindi (India)
        name = 'हिंदी (भारत)';
      } else if (lang.name === 'ig') {
        name = 'Igbo';
      } else if (lang.name === 'lv') {
        name = 'Latviešu';
      } else if (lang.name === 'latviešu valoda') {
        name = 'Latviešu';
      } else if (lang.name === 'ms-MY') {
        // ms-MY = Malay (Malaysia)
        name = 'بهاس ملايو';
      } else if (lang.name === 'en-IT') {
        name = 'English (Italy)';
      } else if (lang.name === 'el-GR') {
        // el-GR = Greek (Greece)
        name = 'Ελληνικά (Ελλάδα)';
      } else if (lang.name === 'Español') {
        name = 'español';
      } else if (lang.name === 'es_419') {
        name = 'español de América Latina';
      } else if (lang.name === 'es-419') {
        name = 'español de América Latina';
      } else if (lang.name === 'Español de América Latina') {
        name = 'español de América Latina';
      } else if (lang.name === 'es-LA') {
        name = 'español de América Latina';
      } else if (lang.name === 'Español de Argentina') {
        name = 'español de Argentina';
      } else if (lang.name === 'Español de Chile') {
        name = 'español de Chile';
      } else if (lang.name === 'Español de Colombia') {
        name = 'español de Colombia';
      } else if (lang.name === 'Español de México') {
        name = 'español de México';
      } else if (lang.name === 'es-PY') {
        name = 'español de Paraguayo';
      } else if (lang.name === 'Español de Paraguayo') {
        name = 'español de Paraguayo';
      } else if (lang.name === 'Español de Perú') {
        name = 'español de Perú';
      } else if (lang.name === 'Español de Puerto Rico') {
        name = 'español de Puerto Rico';
      } else if (lang.name === 'gl-ES') {
        name = 'Galego (España)';
      } else if (lang.name === 'oc') {
        name = 'Occitan';
      } else if (lang.name === 'ru-UA') {
        name = 'Русский (Украина)';
      } else if (lang.name === 'st') {
        name = 'Sãotomense';
      } else if (lang.name === 'uk-UA') {
        name = 'українська (Україна)';
      } else if (lang.name === '繁体中文（台湾）') {
        // Traditional Chinese (Taiwan)
        name = '繁體中文（台灣）';
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
    TAPi18n.setLanguage(this.tag);
    event.preventDefault();
  },
});

Template.changeSettingsPopup.helpers({
  hiddenSystemMessages() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).hasHiddenSystemMessages;
    } else if (window.localStorage.getItem('hasHiddenSystemMessages')) {
      return true;
    } else {
      return false;
    }
  },
  showCardsCountAt() {
    currentUser = Meteor.user();
    if (currentUser) {
      return Meteor.user().getLimitToShowCardsCount();
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
    currentUser = Meteor.user();
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
    currentUser = Meteor.user();
    if (currentUser) {
      Meteor.call('toggleDesktopDragHandles');
    } else if (window.localStorage.getItem('showDesktopDragHandles')) {
      window.localStorage.removeItem('showDesktopDragHandles');
    } else {
      window.localStorage.setItem('showDesktopDragHandles', 'true');
    }
  },
  'click .js-toggle-system-messages'() {
    currentUser = Meteor.user();
    if (currentUser) {
      Meteor.call('toggleSystemMessages');
    } else if (window.localStorage.getItem('hasHiddenSystemMessages')) {
      window.localStorage.removeItem('hasHiddenSystemMessages');
    } else {
      window.localStorage.setItem('hasHiddenSystemMessages', 'true');
    }
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
    const currentUser = Meteor.user();
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
