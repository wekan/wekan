import { ReactiveCache } from '/imports/reactiveCache';

// We use these when displaying notifications in the notificationsDrawer

// gets all activities associated with the current user
Meteor.publish('notificationActivities', () => {
  const ret = activities();
  return ret;
});

// gets all attachments associated with activities associated with the current user
Meteor.publish('notificationAttachments', function() {
  const ret = ReactiveCache.getAttachments(
    {
      _id: {
        $in: activities()
          .map(v => v.attachmentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  ).cursor;
  return ret;
});

// gets all cards associated with activities associated with the current user
Meteor.publish('notificationCards', function() {
  const ret = ReactiveCache.getCards(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationChecklistItems', function() {
  const ret = ReactiveCache.getChecklistItems(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationChecklists', function() {
  const ret = ReactiveCache.getChecklists(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationComments', function() {
  const ret = ReactiveCache.getCardComments(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationLists', function() {
  const ret = ReactiveCache.getLists(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationSwimlanes', function() {
  const ret = ReactiveCache.getSwimlanes(
    {
      _id: {
        $in: activities()
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
Meteor.publish('notificationUsers', function() {
  const ret = ReactiveCache.getUsers(
    {
      _id: {
        $in: activities()
          .map(v => v.userId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

function activities() {
  const activityIds = ReactiveCache.getCurrentUser()?.profile?.notifications?.map(v => v.activity) || [];
  let ret = [];
  if (activityIds.length > 0) {
    ret = ReactiveCache.getActivities(
      {
        _id: { $in: activityIds },
      },
      {},
      true,
    );
  }
  return ret;
}
