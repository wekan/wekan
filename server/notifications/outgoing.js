if (Meteor.isServer) {
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
    _timer: {},
    echoDelay: 500, // echo should be happening much faster
    normalDelay: 1e3, // normally user typed comment will be much slower
    ECHO: 2,
    NORMAL: 1,
    NULL: 0,
    has(id, value) {
      const existing = this._lock[id];
      let ret = this.NULL;
      if (existing) {
        ret = existing === value ? this.ECHO : this.NORMAL;
      }
      return ret;
    },
    clear(id, delay) {
      const previous = this._timer[id];
      if (previous) {
        Meteor.clearTimeout(previous);
      }
      this._timer[id] = Meteor.setTimeout(() => this.unset(id), delay);
    },
    set(id, value) {
      const state = this.has(id, value);
      let delay = this.normalDelay;
      if (state === this.ECHO) {
        delay = this.echoDelay;
      }
      if (!value) {
        // user commented, we set a lock
        value = 1;
      }
      this._lock[id] = value;
      this.clear(id, delay); // always auto reset the locker after delay
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
    'customField',
    'customFieldValue',
    'attachmentId',
  ];
  const responseFunc = data => {
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
      const board = Boards.findOne(paramBoardId);
      const card = Cards.findOne(paramCardId);
      if (board && card) {
        if (comment) {
          Lock.set(comment._id, newComment);
          CardComments.direct.update(comment._id, {
            $set: {
              text: newComment,
            },
          });
        }
      } else {
        const userId = data.userId;
        if (userId) {
          const inserted = CardComments.direct.insert({
            text: newComment,
            userId,
            cardId,
            boardId,
          });
          Lock.set(inserted._id, newComment);
        }
      }
    }
  };
  Meteor.methods({
    outgoingWebhooks(integration, description, params) {
      if (Meteor.user()) {
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
          'attachmentId',
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
          data: is2way ? { description, ...clonedParams } : value,
        };

        if (!Integrations.findOne({ url: integration.url })) return;

        const url = integration.url;

        if (is2way) {
          const cid = params.commentId;
          const comment = params.comment;
          const lockState = cid && Lock.has(cid, comment);
          if (cid && lockState !== Lock.NULL) {
            // it's a comment  and there is a previous lock
            return;
          } else if (cid) {
            Lock.set(cid, comment); // set a lock here
          }
        }
        const response = postCatchError(url, options);

        if (
          response &&
          response.statusCode &&
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          if (is2way) {
            const data = response.data; // only an JSON encoded response will be actioned
            if (data) {
              try {
                responseFunc(data);
              } catch (e) {
                throw new Meteor.Error('error-process-data');
              }
            }
          }
          return response; // eslint-disable-line consistent-return
        } else {
          throw new Meteor.Error('error-invalid-webhook-response');
        }
      }
    },
  });
}
