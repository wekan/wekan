'use strict';
// Identity is the activity, not the mutable read flag. A delivery retry must
// neither append another row nor turn a read notification back into unread.
async function addNotificationOnce(users, userId, activityId) {
  if (![userId, activityId].every(value => typeof value === 'string' && value)) {
    throw new Error('invalid-notification-identity');
  }
  let failure;
  try {
    await users.updateAsync({ _id: userId, 'profile.notifications.activity': { $ne: activityId } }, {
      $addToSet: { 'profile.notifications': { activity: activityId, read: null } },
    });
  } catch (error) { failure = error; }
  // Zero matches may mean an earlier delivery already succeeded. Confirm that
  // same identity, including after a lost write reply; a missing user is not a
  // successful delivery. No whole-array replacement can race with read edits.
  const saved = await users.findOneAsync({ _id: userId, 'profile.notifications.activity': activityId },
    { fields: { _id: 1 } });
  if (saved) return 1;
  if (failure) throw failure;
  return 0;
}
module.exports = { addNotificationOnce };
