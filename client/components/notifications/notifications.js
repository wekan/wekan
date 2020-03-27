// this hides the notifications drawer if anyone clicks off of the panel
Template.body.events({
  click(event) {
    if (
      !$(event.target).is('#notifications *') &&
      Session.get('showNotificationsDrawer')
    ) {
      toggleNotificationsDrawer();
    }
  },
});

Template.notifications.helpers({
  unreadNotifications() {
    const notifications = Users.findOne(Meteor.userId()).notifications();
    const unreadNotifications = _.filter(notifications, v => !v.read);
    return unreadNotifications.length;
  },
});

Template.notifications.events({
  'click .notifications-drawer-toggle'() {
    toggleNotificationsDrawer();
  },
});

export function toggleNotificationsDrawer() {
  Session.set(
    'showNotificationsDrawer',
    !Session.get('showNotificationsDrawer'),
  );
}
