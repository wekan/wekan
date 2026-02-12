import { ReactiveCache } from '/imports/reactiveCache';

Template.notification.events({
  'click .read-status .materialCheckBox'() {
    const update = {};
    const newReadValue = this.read ? null : Date.now();
    update[`profile.notifications.${this.index}.read`] = newReadValue;

    Users.update(Meteor.userId(), { $set: update }, (error, result) => {
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

    const dateFormat = user.getDateFormat ? user.getDateFormat() : 'L';
    const timeFormat = user.getTimeFormat ? user.getTimeFormat() : 'LT';

    return moment(activity.createdAt).format(`${dateFormat} ${timeFormat}`);
  },
});
