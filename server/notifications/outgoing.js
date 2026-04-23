import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { fetchSafe } from '/server/lib/ssrfGuard';
import CardComments from '/models/cardComments';
import Integrations from '/models/integrations';

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
        await CardComments.direct.updateAsync(comment._id, {
          $set: {
            text: newComment,
          },
        });
      }
    }
  };
Meteor.methods({
    async outgoingWebhooks(integration, description, params) {
      if (this.userId) {
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

        const userId = params.userId || integration.userId || this.userId;
        const user = await ReactiveCache.getUser(userId);
        if (!user || typeof user.getLanguage !== 'function') {
          return;
        }
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
        const fetchHeaders = {
          'Content-Type': 'application/json',
        };
        if (token) fetchHeaders['X-Wekan-Token'] = token;

        if (!(await ReactiveCache.getIntegration({ url: integration.url }))) return;

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

        // fetchSafe resolves DNS once, pins the connection to the resolved IP,
        // and blocks redirects — fully preventing DNS-rebinding SSRF attacks.
        let response;
        try {
          response = await fetchSafe(url, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(is2way ? { description, ...clonedParams } : value),
          });
        } catch (err) {
          throw new Meteor.Error(
            'invalid-webhook-url',
            `Webhook request failed: ${err.message}`,
          );
        }

        if (response && response.status >= 200 && response.status < 300) {
          if (is2way) {
            // Only act on a JSON-encoded response body
            let data = null;
            try {
              data = await response.json();
            } catch {
              data = null;
            }
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
