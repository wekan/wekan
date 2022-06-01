// We use these when displaying notifications in the notificationsDrawer

// gets all activities associated with the current user
Meteor.publish('notificationActivities', () => {
  return activities();
});

// gets all attachments associated with activities associated with the current user
Meteor.publish('notificationAttachments', function() {
  return Attachments.find({
    _id: {
      $in: activities()
        .map(v => v.attachmentId)
        .filter(v => !!v),
    }.cursor,
  });
});

// gets all cards associated with activities associated with the current user
Meteor.publish('notificationCards', function() {
  return Cards.find({
    _id: {
      $in: activities()
        .map(v => v.cardId)
        .filter(v => !!v),
    },
  });
});

// gets all checklistItems associated with activities associated with the current user
Meteor.publish('notificationChecklistItems', function() {
  return ChecklistItems.find({
    _id: {
      $in: activities()
        .map(v => v.checklistItemId)
        .filter(v => !!v),
    },
  });
});

// gets all checklists associated with activities associated with the current user
Meteor.publish('notificationChecklists', function() {
  return Checklists.find({
    _id: {
      $in: activities()
        .map(v => v.checklistId)
        .filter(v => !!v),
    },
  });
});

// gets all comments associated with activities associated with the current user
Meteor.publish('notificationComments', function() {
  return CardComments.find({
    _id: {
      $in: activities()
        .map(v => v.commentId)
        .filter(v => !!v),
    },
  });
});

// gets all lists associated with activities associated with the current user
Meteor.publish('notificationLists', function() {
  return Lists.find({
    _id: {
      $in: activities()
        .map(v => v.listId)
        .filter(v => !!v),
    },
  });
});

// gets all swimlanes associated with activities associated with the current user
Meteor.publish('notificationSwimlanes', function() {
  return Swimlanes.find({
    _id: {
      $in: activities()
        .map(v => v.swimlaneId)
        .filter(v => !!v),
    },
  });
});

// gets all users associated with activities associated with the current user
Meteor.publish('notificationUsers', function() {
  return Users.find({
    _id: {
      $in: activities()
        .map(v => v.userId)
        .filter(v => !!v),
    },
  });
});

function activities() {
  const notifications = Meteor.user().profile.notifications || [];
  return Activities.find({
    _id: { $in: notifications.map(v => v.activity) },
  });
}
