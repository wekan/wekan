const QQBOT_HOST = process.env.QQBOT_HOST || '';
const QQBOT_PORT = process.env.QQBOT_PORT || 3200;

const qqSend = (params, callback) => {
  if (!QQBOT_HOST) return;
  const url = `http://${QQBOT_HOST}:${QQBOT_PORT}/send`;
  try {
    HTTP.post(url, { data: params }, (err, res) => {
      if(callback) return callback(err, res);
    });
  } catch (e) {
    if(callback) return callback(e, 'failed post to qqbot');
  }
};

const cardUrl = (card) => {
  const board = card.board();
  let rootUrl = process.env.ROOT_URL;
  if(!rootUrl.endsWith('/')) rootUrl = `${rootUrl}/`;
  return `${rootUrl}b/${board._id}/${board.slug}/${card._id}`;
};

const showName = (user) => {
  if (user.profile && user.profile.fullname)
    return `${user.profile.fullname}(${user.username})`;
  else
    return user.username;
};

const actHandlers = {
  moveCard: (act, callback) => {
    const user = act.user();
    const card = act.card();
    const list = act.list();
    const actStr = TAPi18n.__('activity-moved', {
      postProcess: 'sprintf',
      sprintf: [
        `[${card.title}]`,
        `[${act.oldList().title}]`,
        `[${list.title}]`,
      ],
    }, user.profile.language);
    const msg = `${showName(user)} ${actStr} -- ${cardUrl(card)}`;
    if(callback) return callback(_.union([user._id], card.members, list.members), msg);
  },

  addComment: (act, callback) => {
    const user = act.user();
    const card = act.card();
    const actStr = TAPi18n.__('activity-on', {
      postProcess: 'sprintf',
      sprintf: [
        `[${card.title}]`,
      ],
    }, user.profile.language);
    const msg = `${showName(user)} ${actStr} [${act.comment().text}] -- ${cardUrl(card)}`;
    if(callback) return callback(_.union([user._id], card.members), msg);
  },

  joinMember: (act, callback) => {
    const user = act.user();
    const card = act.card();
    const member = act.member();
    const actStr = TAPi18n.__('activity-added', {
      postProcess: 'sprintf',
      sprintf: [
        `[${showName(member)}]`,
        `[${card.title}]`,
      ],
    }, user.profile.language);
    const msg = `${showName(user)} ${actStr} -- ${cardUrl(card)}`;
    if(callback) return callback(_.union([user._id], [member._id]), msg);
  },

};

Meteor.startup(() => {
  if (!QQBOT_HOST) return;
  Activities.after.insert((userId, doc) => {
    const func = actHandlers[ doc.activityType ];
    if (func) {
      const act = Activities.findOne(doc._id);
      func(act, (users, msg) => {
        const qqlist = [];
        if (users) {
          users.forEach((userId) => {
            const user = Users.findOne(userId);
            if (user && user.profile && user.profile.qq) {
              if (!_.contains(qqlist, user.profile.qq)) qqlist.push(user.profile.qq);
            }
          });
        }
        qqlist.forEach((to) => {
          qqSend({ type:'buddy', to, msg });
        });
      });
    }
  });
});
