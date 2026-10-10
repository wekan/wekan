import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';
import { trayClearItemHtml } from '/client/lib/notificationTray';

Template.notification.events({
  async 'click .read-status .materialCheckBox'() {
    const update = {};
    const newReadValue = this.read ? null : new Date();
    update[`profile.notifications.${this.index}.read`] = newReadValue;

    await Users.updateAsync(Meteor.userId(), { $set: update }).catch((error) => {
      if (error) {
        console.error('Error updating notification:', error);
      }
    });
  },
  'click .remove a'() {
    ReactiveCache.getCurrentUser().removeNotification(this.activityData._id);
  },
});

Template.notification.helpers({
  mode: 'board',
  clearItem() {
    return trayClearItemHtml(this.activityData);
  },
  isOfActivityType(activityId, type) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity && activity.activityType === type;
  },
  activityType(activityId) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity ? activity.activityType : '';
  },
  activityUser(activityId) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity && activity.userId;
  },
  activityDate() {
    const activity = this.activityData;
    if (!activity || !activity.createdAt) return '';

    const user = ReactiveCache.getCurrentUser();
    if (!user) return '';

    const dateObj = new Date(activity.createdAt);
    if (Number.isNaN(dateObj.getTime())) return '';

    const datePart = formatDateForDisplay(dateObj, false);
    const timePart = dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} ${timePart}`.trim();
  },
});
