import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import AccountSettings from '/models/accountSettings';
import Users from '/models/users';
import { Utils } from '/client/lib/utils';
import { ReactiveVar } from 'meteor/reactive-var';
import { detectAvailableFonts } from '/client/lib/fontDetector';
import { fontFamilyValue, fontSizeValue, UI_FONT_SIZES, isHexColor6, colorValue } from '/models/lib/uiFonts';

Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.memberMenuPopup.onCreated(function () {
  Meteor.subscribe('setting');
});

Template.memberMenuPopup.helpers({
  isSupportPageEnabled() {
    const setting = ReactiveCache.getCurrentSetting();
    return setting && setting.supportPageEnabled;
  },
  isSameDomainNameSettingValue(){
    const currSett = ReactiveCache.getCurrentSetting();
    if(currSett && currSett != undefined && currSett.disableRegistration && currSett.mailDomainName !== undefined && currSett.mailDomainName != ""){
      const currentUser = ReactiveCache.getCurrentUser();
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
      const method = (currentUser.authenticationMethod || '').toLowerCase();
      return method !== 'oauth2';
    } else {
      return true;
    }
  }
});

Template.memberMenuPopup.events({
  'click .js-open-bookmarks'(e) {
    e.preventDefault();
    if (Utils.isMiniScreen()) {
      FlowRouter.go('bookmarks');
      Popup.back();
    } else {
      Popup.open('bookmarks')(e);
    }
  },
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
  'click .js-change-color': Popup.open('changeColor'),
  'click .js-change-font': Popup.open('changeFont'),
  'click .js-change-avatar': Popup.open('changeAvatar'),
  'click .js-change-password': Popup.open('changePassword'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-support': Popup.open('support'),
  'click .js-toggle-grey-icons'(event) {
    event.preventDefault();
    const currentUser = ReactiveCache.getCurrentUser();
    if (!currentUser || !Meteor.userId()) return;
    const current = (currentUser.profile && currentUser.profile.GreyIcons) || false;
    Meteor.call('toggleGreyIcons', (err) => {
      if (err && process.env.DEBUG === 'true') console.error('toggleGreyIcons error', err);
    });
  },
  'click .js-logout'(event) {
    event.preventDefault();

    AccountsTemplates.logout();
  },
  'click .js-go-setting'() {
    Popup.back();
  },
});

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
      if (email && /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email.trim())) {
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

Template.editProfilePopup.onCreated(function() {
  Meteor.subscribe('setting');
  this.subscribe('accountSettings');
});

Template.editProfilePopup.helpers({
  allowEmailChange() {
    const setting = AccountSettings.findOne('accounts-allowEmailChange');
    return setting && setting.booleanValue;
  },
  allowUserNameChange() {
    const setting = AccountSettings.findOne('accounts-allowUserNameChange');
    return setting && setting.booleanValue;
  },
  allowUserDelete() {
    const setting = AccountSettings.findOne('accounts-allowUserDelete');
    return setting && setting.booleanValue;
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

    // Use secure server method for self-deletion
    Meteor.call('removeUser', Meteor.userId(), (error, result) => {
      if (error) {
        if (process.env.DEBUG === 'true') {
          console.error('Error removing user:', error);
        }
        alert('Error deleting account: ' + error.reason);
      } else {
        if (process.env.DEBUG === 'true') {
          console.log('User deleted successfully:', result);
        }
        AccountsTemplates.logout();
      }
    });
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
      .map(({ tag, name, rtl }) => ({ tag, name, rtl }))
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

  languageFlag() {
    const flagMap = {
      'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺',
      'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭', 'vi': '🇻🇳',
      'tr': '🇹🇷', 'pl': '🇵🇱', 'nl': '🇳🇱', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴', 'fi': '🇫🇮',
      'cs': '🇨🇿', 'hu': '🇭🇺', 'ro': '🇷🇴', 'bg': '🇧🇬', 'hr': '🇭🇷', 'sk': '🇸🇰', 'sl': '🇸🇮',
      'et': '🇪🇪', 'lv': '🇱🇻', 'lt': '🇱🇹', 'el': '🇬🇷', 'he': '🇮🇱', 'uk': '🇺🇦', 'be': '🇧🇾',
      'ca': '🇪🇸', 'eu': '🇪🇸', 'gl': '🇪🇸', 'cy': '🇬🇧', 'ga': '🇮🇪', 'mt': '🇲🇹', 'is': '🇮🇸',
      'mk': '🇲🇰', 'sq': '🇦🇱', 'sr': '🇷🇸', 'bs': '🇧🇦', 'me': '🇲🇪', 'fa': '🇮🇷', 'ur': '🇵🇰',
      'bn': '🇧🇩', 'ta': '🇮🇳', 'te': '🇮🇳', 'ml': '🇮🇳', 'kn': '🇮🇳', 'gu': '🇮🇳', 'pa': '🇮🇳',
      'or': '🇮🇳', 'as': '🇮🇳', 'ne': '🇳🇵', 'si': '🇱🇰', 'my': '🇲🇲', 'km': '🇰🇭', 'lo': '🇱🇦',
      'ka': '🇬🇪', 'hy': '🇦🇲', 'az': '🇦🇿', 'kk': '🇰🇿', 'ky': '🇰🇬', 'uz': '🇺🇿', 'mn': '🇲🇳',
      'bo': '🇨🇳', 'dz': '🇧🇹', 'ug': '🇨🇳', 'ii': '🇨🇳', 'za': '🇨🇳', 'yue': '🇭🇰', 'zh-HK': '🇭🇰',
      'zh-TW': '🇹🇼', 'zh-CN': '🇨🇳', 'id': '🇮🇩', 'ms': '🇲🇾', 'tl': '🇵🇭', 'ceb': '🇵🇭',
      'haw': '🇺🇸', 'mi': '🇳🇿', 'sm': '🇼🇸', 'to': '🇹🇴', 'fj': '🇫🇯', 'ty': '🇵🇫', 'mg': '🇲🇬',
      'sw': '🇹🇿', 'am': '🇪🇹', 'om': '🇪🇹', 'so': '🇸🇴', 'ti': '🇪🇷', 'ha': '🇳🇬', 'yo': '🇳🇬',
      'ig': '🇳🇬', 'zu': '🇿🇦', 'xh': '🇿🇦', 'af': '🇿🇦', 'st': '🇿🇦', 'tn': '🇿🇦', 'ss': '🇿🇦',
      've': '🇿🇦', 'ts': '🇿🇦', 'nr': '🇿🇦', 'nso': '🇿🇦', 'wo': '🇸🇳', 'ff': '🇸🇳', 'dy': '🇲🇱',
      'bm': '🇲🇱', 'tw': '🇬🇭', 'ak': '🇬🇭', 'lg': '🇺🇬', 'rw': '🇷🇼', 'rn': '🇧🇮', 'ny': '🇲🇼',
      'sn': '🇿🇼', 'nd': '🇿🇼'
    };
    return flagMap[this.tag] || '🌐';
  },
});

Template.changeLanguagePopup.events({
  'click .js-set-language'(event) {
    Users.update(Meteor.userId(), {
      $set: {
        'profile.language': this.tag,
      },
    });
    // setLanguage is async; surface a failed load instead of silently leaving
    // the UI in English (#5756).
    Promise.resolve(TAPi18n.setLanguage(this.tag)).catch(error => {
      // eslint-disable-next-line no-console
      console.error(`Failed to switch language to ${this.tag}:`, error);
    });
    event.preventDefault();
  },
});

Template.changeSettingsPopup.helpers({
  isSubmitOnEnter() {
    const currentUser = ReactiveCache.getCurrentUser();
    return currentUser ? currentUser.hasSubmitOnEnter() : false;
  },
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
    const currentUser = ReactiveCache.getCurrentUser();
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
  'click .js-toggle-submit-on-enter'() {
    // Saved to the user profile (Member Settings only; requires a logged-in user).
    if (ReactiveCache.getCurrentUser()) {
      Meteor.call('toggleSubmitOnEnter');
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

// #5778 + docs/Theme/Theme.md: the Member Menu / Change Color popup renders the
// shared themeColorPicker (scope="global"); all of its logic lives there.

// #4759: Member Menu / Font. A dropdown of fonts detected as installed in this
// browser; the value is stored to the profile and validated server-side. The first
// option unsets the custom font.
Template.changeFontPopup.onCreated(function () {
  const user = ReactiveCache.getCurrentUser();
  this.available = detectAvailableFonts(); // ordered subset of the curated whitelist
  this.selected = new ReactiveVar((user && user.getUiFont && user.getUiFont()) || '');
  this.selectedSize = new ReactiveVar((user && user.getUiFontSize && user.getUiFontSize()) || 'default');
  // null = use default (unset); a hex string = custom color.
  this.textColor = new ReactiveVar((user && user.getUiTextColor && user.getUiTextColor()) || null);
  this.bgColor = new ReactiveVar((user && user.getUiTextBgColor && user.getUiTextBgColor()) || null);
});

Template.changeFontPopup.helpers({
  detectedFonts() {
    const tpl = Template.instance();
    const sel = tpl.selected.get();
    return tpl.available.map(name => ({
      name,
      selected: name === sel,
      optionStyle: `font-family: "${name}", sans-serif;`,
    }));
  },
  isNoneSelected() {
    return !Template.instance().selected.get();
  },
  fontSizes() {
    const cur = Template.instance().selectedSize.get();
    // Ordered by percent so the buttons read: smaller ... 100% (default) ... larger.
    return [...UI_FONT_SIZES].sort((a, b) => a.percent - b.percent).map(s => ({
      key: s.key,
      label: TAPi18n.__(`font-size-${s.key}`),
      selected: s.key === cur,
    }));
  },
  // Wheel <input type=color> needs a hex value even when unset — show a sensible
  // default so the wheel opens somewhere reasonable.
  textColorHex() {
    return Template.instance().textColor.get() || '#000000';
  },
  bgColorHex() {
    return Template.instance().bgColor.get() || '#ffffff';
  },
  hasTextColor() {
    return !!Template.instance().textColor.get();
  },
  hasBgColor() {
    return !!Template.instance().bgColor.get();
  },
  // Preview reflects the chosen font, size, text color and background color.
  previewStyle() {
    const tpl = Template.instance();
    const family = fontFamilyValue(tpl.selected.get());
    const size = fontSizeValue(tpl.selectedSize.get());
    const color = colorValue(tpl.textColor.get());
    const bg = colorValue(tpl.bgColor.get());
    return [
      family && `font-family: ${family};`,
      size && `font-size: ${size};`,
      color && `color: ${color};`,
      bg && `background-color: ${bg};`,
    ].filter(Boolean).join('');
  },
});

// Apply the current text/background colors immediately (no Save button).
function applyUiColors(tpl) {
  Meteor.call('setUiColors', tpl.textColor.get(), tpl.bgColor.get(), err => {
    if (err && process.env.DEBUG === 'true') console.error('setUiColors error', err);
  });
}

Template.changeFontPopup.events({
  // Click a font-name button -> apply that font immediately ('' = default/unset).
  'click .js-ui-font-btn'(event, tpl) {
    event.preventDefault();
    const font = event.currentTarget.dataset.font || null;
    tpl.selected.set(font || '');
    Meteor.call('setUiFont', font, err => {
      if (err && process.env.DEBUG === 'true') console.error('setUiFont error', err);
    });
  },
  // Click a size button -> apply that size immediately.
  'click .js-ui-font-size-btn'(event, tpl) {
    event.preventDefault();
    const size = event.currentTarget.dataset.size || 'default';
    tpl.selectedSize.set(size);
    Meteor.call('setUiFontSize', size, err => {
      if (err && process.env.DEBUG === 'true') console.error('setUiFontSize error', err);
    });
  },
  // Live-preview while dragging the wheel...
  'input .js-ui-text-color'(event, tpl) {
    const v = event.currentTarget.value;
    if (isHexColor6(v)) tpl.textColor.set(v);
  },
  'input .js-ui-bg-color'(event, tpl) {
    const v = event.currentTarget.value;
    if (isHexColor6(v)) tpl.bgColor.set(v);
  },
  // ...and apply the color when the wheel is committed.
  'change .js-ui-text-color'(event, tpl) {
    const v = event.currentTarget.value;
    if (isHexColor6(v)) tpl.textColor.set(v);
    applyUiColors(tpl);
  },
  'change .js-ui-bg-color'(event, tpl) {
    const v = event.currentTarget.value;
    if (isHexColor6(v)) tpl.bgColor.set(v);
    applyUiColors(tpl);
  },
  'click .js-reset-text-color'(event, tpl) {
    event.preventDefault();
    tpl.textColor.set(null); // back to default
    applyUiColors(tpl);
  },
  'click .js-reset-bg-color'(event, tpl) {
    event.preventDefault();
    tpl.bgColor.set(null);
    applyUiColors(tpl);
  },
});
