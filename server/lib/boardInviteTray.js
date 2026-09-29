import Activities from '/models/activities';
import { prepareTrayNotification } from '/server/notifications/profile';
import { trayDelivery } from '/server/notifications/trayQueue';

// #3136: an existing user invited to a board is told in the in-app
// notification bell, not only by email.
//
// The bell lists activities, and tray delivery refuses an entry without one.
// The invite used to call Notifications.notify() with an invite-only params
// object: that object was declared inside the email block, so the call threw
// a ReferenceError the surrounding catch logged, and even with it in scope the
// tray service would have refused the missing activityId while the email
// service queued a second email beside the invitation itself.
//
// So the invite delivers the membership's own addBoardMember activity, which
// the bell already renders ("added member ... to board ..."), to the invitee's
// tray only, honouring the admin/board/member tray settings. A new membership
// gets that activity from Boards.after.update; a re-activated one records it
// here, since re-adding someone is still adding a member. Inviting somebody
// who is already an active member adds nobody, so there is no activity and
// nothing to deliver.
export async function deliverBoardInviteToTray({ user, boardId, inviterId, since, reactivated }) {
  if (reactivated) {
    await Activities.insertAsync({
      userId: inviterId,
      memberId: user._id,
      type: 'member',
      activityType: 'addBoardMember',
      boardId,
    });
  }
  if (!await prepareTrayNotification(user, { boardId })) return null;
  const activity = await Activities.findOneAsync(
    { activityType: 'addBoardMember', boardId, memberId: user._id, createdAt: { $gte: since } },
    { sort: { createdAt: -1 }, fields: { _id: 1 } },
  );
  if (!activity) return null;
  await trayDelivery.deliver(user._id, activity._id);
  return activity._id;
}
