const postCatchError = Meteor.wrapAsync((url, options, resolve) => {
  HTTP.post(url, options, (err, res) => {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});

const Lock = {
  _lock: {},
  has(id) {
    return !!this._lock[id];
  },
  set(id) {
    this._lock[id] = 1;
  },
  unset(id) {
    delete this._lock[id];
  },
};

const webhooksAtbts = (process.env.WEBHOOKS_ATTRIBUTES &&
  process.env.WEBHOOKS_ATTRIBUTES.split(',')) || [
  'cardId',
  'listId',
  'oldListId',
  'boardId',
  'comment',
  'user',
  'card',
  'commentId',
  'swimlaneId',
];
const responseFunc = 'reactOnHookResponse';
Meteor.methods({
  [responseFunc](data) {
    check(data, Object);
    const paramCommentId = data.commentId;
    const paramCardId = data.cardId;
    const paramBoardId = data.boardId;
    const newComment = data.comment;
    if (paramCardId && paramBoardId && newComment) {
      // only process data with the cardid, boardid and comment text, TODO can expand other functions here to react on returned data
      const comment = CardComments.findOne({
        _id: paramCommentId,
        cardId: paramCardId,
        boardId: paramBoardId,
      });
      if (comment) {
        CardComments.update(comment._id, {
          $set: {
            text: newComment,
          },
        });
      } else {
        const userId = data.userId;
        if (userId) {
          CardComments.insert({
            text: newComment,
            userId,
            cardId,
            boardId,
          });
        }
      }
    }
  },
  outgoingWebhooks(integration, description, params) {
    check(integration, Object);
    check(description, String);
    check(params, Object);
    this.unblock();

    // label activity did not work yet, see wekan/models/activities.js
    const quoteParams = _.clone(params);
    const clonedParams = _.clone(params);
    [
      'card',
      'list',
      'oldList',
      'board',
      'oldBoard',
      'comment',
      'checklist',
      'swimlane',
      'oldSwimlane',
      'label',
      'attachment',
    ].forEach(key => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });

    const userId = params.userId ? params.userId : integrations[0].userId;
    const user = Users.findOne(userId);
    const text = `${params.user} ${TAPi18n.__(
      description,
      quoteParams,
      user.getLanguage(),
    )}\n${params.url}`;

    if (text.length === 0) return;

    const value = {
      text: `${text}`,
    };

    webhooksAtbts.forEach(key => {
      if (params[key]) value[key] = params[key];
    });
    value.description = description;
    //integrations.forEach(integration => {
    const is2way = integration.type === Integrations.Const.TWOWAY;
    const token = integration.token || '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['X-Wekan-Token'] = token;
    const options = {
      headers,
      data: is2way ? clonedParams : value,
    };
    const url = integration.url;
    const response = postCatchError(url, options);

    if (
      response &&
      response.statusCode &&
      response.statusCode >= 200 &&
      response.statusCode < 300
    ) {
      if (is2way) {
        const cid = params.commentId;
        const tooSoon = Lock.has(cid); // if an activity happens to fast, notification shouldn't fire with the same id
        if (!tooSoon) {
          let clearNotification = () => {};
          if (cid) {
            Lock.set(cid);
            const clearNotificationFlagTimeout = 1000;
            clearNotification = () => Lock.unset(cid);
            Meteor.setTimeout(clearNotification, clearNotificationFlagTimeout);
          }
          const data = response.data; // only an JSON encoded response will be actioned
          if (data) {
            Meteor.call(responseFunc, data, () => {
              clearNotification();
            });
          }
        }
      }
      return response; // eslint-disable-line consistent-return
    } else {
      throw new Meteor.Error('error-invalid-webhook-response');
    }
    //});
  },
});
