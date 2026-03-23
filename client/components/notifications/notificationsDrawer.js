import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { toggleNotificationsDrawer } from './notifications.js';
import Users from '/models/users';

Template.notificationsDrawer.onCreated(function() {
  Meteor.subscribe('notificationActivities');
  Meteor.subscribe('notificationCards');
  Meteor.subscribe('notificationUsers');
  Meteor.subscribe('notificationsAttachments');
  Meteor.subscribe('notificationChecklistItems');
  Meteor.subscribe('notificationChecklists');
  Meteor.subscribe('notificationComments');
  Meteor.subscribe('notificationLists');
  Meteor.subscribe('notificationSwimlanes');
});

Template.notificationsDrawer.helpers({
  notifications() {
    const user = ReactiveCache.getCurrentUser();
    return user ? user.notifications() : [];
  },
  transformedProfile() {
    return ReactiveCache.getCurrentUser();
  },
  readNotifications() {
    const user = ReactiveCache.getCurrentUser();
    const list = user ? user.notifications() : [];
    const readNotifications = list.filter(v => !!v.read);
    return readNotifications.length;
  },
});

Template.notificationsDrawer.events({
  'click .notification-menu-toggle'(event) {
    event.stopPropagation();
    Session.set('showNotificationMenu', !Session.get('showNotificationMenu'));
  },
  async 'click .notification-menu .menu-item'(event) {
    const target = event.currentTarget;

    if (target.classList.contains('mark-all-read')) {
      const notifications = ReactiveCache.getCurrentUser().profile.notifications;
      for (const index in notifications) {
        if (notifications.hasOwnProperty(index) && !notifications[index].read) {
          const update = {};
          update[`profile.notifications.${index}.read`] = new Date();
          await Users.updateAsync(Meteor.userId(), { $set: update }).catch((error) => {
            console.error('Error marking notification as read:', error);
          });
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('mark-all-unread')) {
      const notifications = ReactiveCache.getCurrentUser().profile.notifications;
      for (const index in notifications) {
        if (notifications.hasOwnProperty(index) && notifications[index].read) {
          const update = {};
          update[`profile.notifications.${index}.read`] = null;
          await Users.updateAsync(Meteor.userId(), { $set: update }).catch((error) => {
            console.error('Error marking notification as unread:', error);
          });
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('delete-read')) {
      const user = ReactiveCache.getCurrentUser();
      for (const notification of user.profile.notifications) {
        if (notification.read) {
          user.removeNotification(notification.activity);
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('delete-all')) {
      if (confirm(TAPi18n.__('delete-all-notifications-confirm'))) {
        const user = ReactiveCache.getCurrentUser();
        const notificationsCopy = [...user.profile.notifications];
        for (const notification of notificationsCopy) {
          user.removeNotification(notification.activity);
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('selected')) {
      // Already selected, do nothing
      Session.set('showNotificationMenu', false);
    } else {
      // Toggle view
      Session.set('showReadNotifications', !Session.get('showReadNotifications'));
      Session.set('showNotificationMenu', false);
    }
  },
  'click .close'() {
    Session.set('showNotificationMenu', false);
    toggleNotificationsDrawer();
  },
  'click'(event) {
    // Close menu when clicking outside
    if (!event.target.closest('.notification-menu') && !event.target.closest('.notification-menu-toggle')) {
      Session.set('showNotificationMenu', false);
    }
  },
});
