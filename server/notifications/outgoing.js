import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

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

  // SSRF Protection: Validate webhook URLs before posting
  const isValidWebhookUrl = (urlString) => {
    try {
      const u = new URL(urlString);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(u.protocol)) {
        return false;
      }

      // Block private/loopback IP ranges and hostnames
      const hostname = u.hostname.toLowerCase();
      const blockedPatterns = [
        /^127\./, // 127.x.x.x (loopback)
        /^10\./, // 10.x.x.x (private)
        /^172\.(1[6-9]|2\d|3[01])\./, // 172.16-31.x.x (private)
        /^192\.168\./, // 192.168.x.x (private)
        /^0\./, // 0.x.x.x (current network)
        /^::1$/, // IPv6 loopback
        /^fe80:/, // IPv6 link-local
        /^fc00:/, // IPv6 unique local
        /^fd00:/, // IPv6 unique local
        /^localhost$/i,
        /\.local$/i,
        /^169\.254\./, // link-local IP (AWS metadata)
      ];

      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

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
    'labelId',
    'label',
    'attachmentId',
  ];
  const responseFunc = async (data, integration) => {
    const paramCommentId = data.commentId;
    const paramCardId = data.cardId;
    const paramBoardId = data.boardId;
    const newComment = data.comment;

    // Authorization: Verify the request is from a bidirectional webhook
    if (!integration || integration.type !== Integrations.Const.TWOWAY) {
      return; // Only bidirectional webhooks can update comments
    }

    // Authorization: Prevent cross-board comment injection
    if (paramBoardId !== integration.boardId) {
      return; // Webhook can only modify comments in its own board
    }

    if (paramCardId && paramBoardId && newComment && paramCommentId) {
      // only process data with the commentId, cardId, boardId and comment text
      const comment = await ReactiveCache.getCardComment({
        _id: paramCommentId,
        cardId: paramCardId,
        boardId: paramBoardId,
      });
      const board = await ReactiveCache.getBoard(paramBoardId);
      const card = await ReactiveCache.getCard(paramCardId);

      if (board && card && comment) {
        // Only update existing comments - do not create new comments from webhook responses
        Lock.set(comment._id, newComment);
        CardComments.direct.update(comment._id, {
          $set: {
            text: newComment,
          },
        });
      }
    }
  };
  Meteor.methods({
    async outgoingWebhooks(integration, description, params) {
      if (await ReactiveCache.getCurrentUser()) {
        check(integration, Object);
        check(description, String);
        check(params, Object);
        this.unblock();

        // label activity did not work yet, see wekan/models/activities.js
        const quoteParams = { ...params };
        const clonedParams = { ...params };
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
          'labelId',
          'label',
          'attachment',
          'attachmentId',
        ].forEach(key => {
          if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
        });

        const userId = params.userId ? params.userId : integrations[0].userId;
        const user = await ReactiveCache.getUser(userId);
        const descriptionText = TAPi18n.__(
          description,
          quoteParams,
          user.getLanguage(),
        );

        // If you don't want a hook, set the webhook description to "-".
        if (descriptionText === "-") return;

        const text = `${params.user} ${descriptionText}\n${params.url}`;

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

        if (!(await ReactiveCache.getIntegration({ url: integration.url }))) return;

        const url = integration.url;

        // SSRF Protection: Validate webhook URL before posting
        if (!isValidWebhookUrl(url)) {
          throw new Meteor.Error('invalid-webhook-url', 'Webhook URL is invalid or points to a private/internal address');
        }

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
                await responseFunc(data, integration);
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
