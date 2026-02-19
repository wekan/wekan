import { ReactiveCache } from '/imports/reactiveCache';

// We use these when displaying notifications in the notificationsDrawer

// gets all activities associated with the current user
Meteor.publish('notificationActivities', async () => {
  const ret = await activities();
  return ret;
});

// gets all attachments associated with activities associated with the current user
Meteor.publish('notificationAttachments', async function() {
  const ret = (await ReactiveCache.getAttachments(
    {
      _id: {
        $in: (await activities())
          .map(v => v.attachmentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  )).cursor;
  return ret;
});

// gets all cards associated with activities associated with the current user
Meteor.publish('notificationCards', async function() {
  const ret = await ReactiveCache.getCards(
    {
      _id: {
        $in: (await activities())
          .map(v => v.cardId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all checklistItems associated with activities associated with the current user
Meteor.publish('notificationChecklistItems', async function() {
  const ret = await ReactiveCache.getChecklistItems(
    {
      _id: {
        $in: (await activities())
          .map(v => v.checklistItemId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all checklists associated with activities associated with the current user
Meteor.publish('notificationChecklists', async function() {
  const ret = await ReactiveCache.getChecklists(
    {
      _id: {
        $in: (await activities())
          .map(v => v.checklistId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all comments associated with activities associated with the current user
Meteor.publish('notificationComments', async function() {
  const ret = await ReactiveCache.getCardComments(
    {
      _id: {
        $in: (await activities())
          .map(v => v.commentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all lists associated with activities associated with the current user
Meteor.publish('notificationLists', async function() {
  const ret = await ReactiveCache.getLists(
    {
      _id: {
        $in: (await activities())
          .map(v => v.listId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all swimlanes associated with activities associated with the current user
Meteor.publish('notificationSwimlanes', async function() {
  const ret = await ReactiveCache.getSwimlanes(
    {
      _id: {
        $in: (await activities())
          .map(v => v.swimlaneId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all users associated with activities associated with the current user
Meteor.publish('notificationUsers', async function() {
  const ret = await ReactiveCache.getUsers(
    {
      _id: {
        $in: (await activities())
          .map(v => v.userId)
          .filter(v => !!v),
      },
    },
    {
      fields: {
        username: 1,
        'profile.fullname': 1,
        'profile.avatarUrl': 1,
        'profile.initials': 1,
      },
    },
    true,
  );
  return ret;
});

async function activities() {
  const activityIds = (await ReactiveCache.getCurrentUser())?.profile?.notifications?.map(v => v.activity) || [];
  let ret = [];
  if (activityIds.length > 0) {
    ret = await ReactiveCache.getActivities(
      {
        _id: { $in: activityIds },
      },
      {},
      true,
    );
  }
  return ret;
}
