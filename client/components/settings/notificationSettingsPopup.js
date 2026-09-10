import { ReactiveCache } from '/imports/reactiveCache';
import { NOTIFICATION_SERVICES } from '/models/lib/notificationSettings';
import { Utils } from '/client/lib/utils';

// The 3-tier Notification Settings popup (see notificationSettingsPopup.jade
// and models/lib/notificationSettings.js). `this.data().scope` is one of
// 'admin' | 'board' | 'member', set by whichever menu entry opened it
// (Popup.open('notificationSettings', { scope }) in userHeader.js/sidebar.js,
// or passed directly as the pane's data context in peopleBody.jade).
//
// At 'board' scope the board id comes from Utils.getCurrentBoardId() - the
// popup is only ever opened from the currently open board's sidebar.

function currentBoard() {
  return ReactiveCache.getBoard(Utils.getCurrentBoardId());
}

function currentValue(scope, service) {
  const field = service === 'email' ? 'notifyOverrideEmail' : 'notifyOverrideTray';
  const adminField = service === 'email' ? 'notifyDefaultEmail' : 'notifyDefaultTray';
  if (scope === 'admin') {
    const setting = ReactiveCache.getCurrentSetting();
    const value = setting && setting[adminField];
    return value === false ? false : true; // defaultValue: true
  }
  if (scope === 'board') {
    const board = currentBoard();
    return board ? board[field] : undefined;
  }
  // member
  const user = ReactiveCache.getCurrentUser();
  const profileField = service === 'email' ? 'notifyOverrideEmail' : 'notifyOverrideTray';
  return user && user.profile ? user.profile[profileField] : undefined;
}

Template.notificationSettingsPopup.helpers({
  isAdminScope() {
    return Template.currentData().scope === 'admin';
  },
  notifyServiceRows() {
    const scope = Template.currentData().scope;
    return Object.keys(NOTIFICATION_SERVICES).map(service => {
      const value = currentValue(scope, service);
      return {
        service,
        icon: service === 'email' ? 'fa-envelope' : 'fa-bell',
        labelKey: service === 'email' ? 'email' : 'notification-settings-tray',
        onSelected: value === true,
        offSelected: value === false,
        inheritSelected: value !== true && value !== false,
      };
    });
  },
});

Template.notificationSettingsPopup.events({
  'click .js-notify-option'(event, instance) {
    event.preventDefault();
    const target = event.currentTarget;
    const service = target.dataset.service;
    const rawValue = target.dataset.value;
    const value = rawValue === 'true' ? true : rawValue === 'false' ? false : null;
    const scope = Template.currentData().scope;

    if (scope === 'admin') {
      // Inherit is not offered at admin scope - it IS the base default - so
      // only true/false ever reach here.
      Meteor.call('setAdminNotifyDefault', service, value === true);
      return;
    }
    if (scope === 'board') {
      const board = currentBoard();
      if (board) board.setNotifyOverride(service, value);
      return;
    }
    const user = ReactiveCache.getCurrentUser();
    if (user) user.setNotifyOverride(service, value);
  },
});
