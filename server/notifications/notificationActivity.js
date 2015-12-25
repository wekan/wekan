const activityNotify = (activity, subject, prefix, strKey, varList, suffix) => {
  let participants = [];
  let watchers = [];
  if (activity.memberId) {
    participants = _.union(participants, [activity.memberId]);
  }
  if (activity.cardId) {
    const card = activity.card();
    participants = _.union(participants, [card.userId], card.members || []);
    watchers = _.union(watchers, card.watchers || []);
  }
  if (activity.listId) {
    watchers = _.union(watchers, activity.list().watchers || []);
  }
  if (activity.oldListId) {
    watchers = _.union(watchers, activity.oldList().watchers || []);
  }
  if (activity.boardId) {
    watchers = _.union(watchers, activity.board().watchers || []);
  }

  // add [] highlight values to make it easier to read
  varList.forEach((v, k, list) => {
    list[k] = ` [${v}] `;
  });
  const params = {
    postProcess: 'sprintf',
    sprintf: varList,
  };

  Notifications.getUsers(participants, watchers).forEach((user) => {
    Notifications.send( user, subject, `${prefix}${TAPi18n.__(strKey, params, user.profile.language)}${suffix}` );
  });
};

Meteor.startup(() => {
  Activities.after.insert((userId, doc) => {
    const activity = Activities.findOne(doc._id);
    Notifications.process(activity.activityType, activity);
  });

  Notifications.events({
    moveCard: (activity) => {
      const card = activity.card();
      activityNotify(
        activity,
        `[${activity.board().title}] ${card.title}`,
        `${activity.user().getName()} `,
        'activity-moved', [
          card.title,
          activity.oldList().title,
          activity.list().title,
        ],
        `\n\n---\n${card.rootUrl()}`
      );
    },

    addComment: (activity) => {
      const card = activity.card();
      activityNotify(
        activity,
        `[${activity.board().title}] ${card.title}`,
        `${activity.user().getName()} `,
        'activity-on', [
          card.title,
        ],
        `\n\n${activity.comment().text}\n\n---\n${card.rootUrl()}`
      );
    },

    joinMember: (activity) => {
      const card = activity.card();
      const actor = activity.user();
      const member = activity.member();
      const sameUser = actor._id === member._id;
      activityNotify(
        activity,
        `[${activity.board().title}] ${card.title}`,
        `${activity.user().getName()} `,
        sameUser ? 'activity-joined' : 'activity-added',
        sameUser ? [
          card.title,
        ] : [
          member.getName(),
          card.title,
        ],
        `\n\n---\n${card.rootUrl()}`
      );
    },

    unjoinMember: (activity) => {
      const card = activity.card();
      const actor = activity.user();
      const member = activity.member();
      const sameUser = actor._id === member._id;
      activityNotify(
        activity,
        `[${activity.board().title}] ${card.title}`,
        `${activity.user().getName()} `,
        sameUser ? 'activity-unjoined' : 'activity-removed',
        sameUser ? [
          card.title,
        ] : [
          member.getName(),
          card.title,
        ],
        `\n\n---\n${card.rootUrl()}`
      );
    },
  });
});
