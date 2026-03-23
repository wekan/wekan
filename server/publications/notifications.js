import { ReactiveCache } from '/imports/reactiveCache';

// We use these when displaying notifications in the notificationsDrawer

// gets all activities associated with the current user
Meteor.publish('notificationActivities', async () => {
  return await activityCursor();
});

// gets all attachments associated with activities associated with the current user
Meteor.publish('notificationAttachments', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getAttachments(
    {
      _id: {
        $in: activityEntries
          .map(v => v.attachmentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all cards associated with activities associated with the current user
Meteor.publish('notificationCards', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getCards(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getChecklistItems(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getChecklists(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getCardComments(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getLists(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getSwimlanes(
    {
      _id: {
        $in: activityEntries
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
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getUsers(
    {
      _id: {
        $in: activityEntries
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

async function activityIds() {
  const activityIds = (await ReactiveCache.getCurrentUser())?.profile?.notifications?.map(v => v.activity) || [];
  return activityIds;
}

async function activityDocs() {
  const ids = await activityIds();
  if (ids.length === 0) {
    return [];
  }
  return await ReactiveCache.getActivities({
    _id: { $in: ids },
  });
}

async function activityCursor() {
  const ids = await activityIds();
  if (ids.length === 0) {
    return [];
  }
  return await ReactiveCache.getActivities(
    {
      _id: { $in: ids },
    },
    {},
    true,
  );
}
