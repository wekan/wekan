import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { fetchSafe } from '/server/lib/ssrfGuard';
import CardComments from '/models/cardComments';
import Integrations from '/models/integrations';
import { buildWebhookBody, hideIdentityFields, memberHidesIdentity } from '/models/lib/webhookPayload';
import { channelOf, resolveChannelSettings, webhookQueueTarget } from '/models/lib/notificationDelivery';

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
    // #3113: the display name (`user`) and the login name, both. WEBHOOKS_ATTRIBUTES
    // overrides this list wholesale, so a deployment that already sets it keeps
    // exactly the fields it asked for.
    'username',
    'card',
    'commentId',
    'swimlaneId',
    'customField',
    'customFieldValue',
    'labelId',
    'label',
    'attachmentId',
    // #3297: the names behind the ids, the person a join or assignment is
    // about, and the link - so a receiver can write its own message, in its
    // own language, and address that person.
    'list',
    'board',
    'swimlane',
    'member',
    'memberUsername',
    'assigneeId',
    'assignee',
    'assigneeUsername',
    'url',
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
// #3695: how one webhook delivers (models/lib/notificationDelivery.js): its
// own setting, then its board's - for the board's own webhooks only; a global
// webhook is the instance admin's - then the Admin Panel default.
export async function webhookDeliveryFor(integration) {
  const setting = await ReactiveCache.getCurrentSetting();
  const ownBoard = integration.boardId && integration.boardId !== Integrations.Const.GLOBAL_WEBHOOK_ID
    ? await ReactiveCache.getBoard(integration.boardId) : null;
  return resolveChannelSettings('webhook', [
    ['integration', channelOf(integration.notificationDelivery, 'webhook')],
    ['board', channelOf(ownBoard && ownBoard.notificationDelivery, 'webhook')],
    ['admin', channelOf(setting && setting.notificationDelivery, 'webhook')],
  ]);
}

// #3695: the people in this activity who asked webhooks to leave them out.
async function webhookHiddenUserIds(params) {
  const ids = [...new Set([params.userId, params.memberId, params.assigneeId]
    .filter(id => typeof id === 'string' && id))];
  const hidden = [];
  for (const id of ids) {
    if (memberHidesIdentity(await ReactiveCache.getUser(id))) hidden.push(id);
  }
  return hidden;
}

// Prepare a detached wire payload without HTTP, comment writes or echo locks.
// A durable caller must persist it and recheck authorization before delivery.
export async function prepareOutgoingWebhook({ integration, description, params, actorId }) {
  integration = structuredClone(integration);
  params = structuredClone(params);
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

  const userId = params.userId || integration.userId || actorId;
  const user = await ReactiveCache.getUser(userId);
  if (!user || typeof user.getLanguage !== 'function') {
    return null;
  }
  // #5875: load the recipient's language bundle on the server before
  // translating, otherwise it falls back to English.
  const language = user.getLanguage();
  await TAPi18n.ensureLanguageLoaded(language);

  // #3695: Member Settings -> Notifications -> "Leave my name out of outgoing
  // webhooks". The actor, and the person a join or assignment is about, are
  // named in neither the text nor the properties when they asked for that.
  const hiddenUserIds = await webhookHiddenUserIds(params);
  if (hiddenUserIds.length) {
    const someone = TAPi18n.__('webhook-someone', {}, language);
    // `params` is this call's own clone; buildWebhookBody / hideIdentityFields
    // drop the `user` property of a hidden actor, so only the text uses this.
    if (params.userId && hiddenUserIds.includes(params.userId)) params.user = quoteParams.user = someone;
    if (params.memberId && hiddenUserIds.includes(params.memberId)) quoteParams.member = someone;
    if (params.assigneeId && hiddenUserIds.includes(params.assigneeId)) quoteParams.assignee = someone;
  }

  const descriptionText = TAPi18n.__(
    description,
    quoteParams,
    language,
  );

  // If you don't want a hook, set the webhook description to "-".
  if (descriptionText === "-") return null;

  const text = `${params.user} ${descriptionText}\n${params.url}`;

  if (text.length === 0) return null;

  // #3695: which properties this webhook carries - the webhook's own choice,
  // then its board's default, then the Admin Panel default; unset everywhere
  // is the unchanged payload (text + the standard attribute list).
  const settings = await webhookDeliveryFor(integration);
  const value = buildWebhookBody({
    description, params, text, settings,
    legacyAttributes: webhooksAtbts, hiddenUserIds,
  });
  const is2way = integration.type === Integrations.Const.TWOWAY;
  const token = integration.token || '';
  const fetchHeaders = {
    'Content-Type': 'application/json',
  };
  if (token) fetchHeaders['X-Wekan-Token'] = token;

  return { url: integration.url, headers: fetchHeaders,
    body: JSON.stringify(is2way
      ? hideIdentityFields({ description, ...clonedParams }, params, hiddenUserIds) : value),
    is2way, language };
}
Meteor.methods({
    async outgoingWebhooks(integration, description, params) {
      if (this.userId) {
        check(integration, Object);
        check(description, String);
        check(params, Object);
        this.unblock();

        integration = structuredClone(integration);
        params = structuredClone(params);

        // The `integration` object is supplied by the caller and must not be
        // trusted: verify a matching integration actually exists on its board
        // AND that the caller is a member of that board. Otherwise any
        // authenticated user could drive webhooks (and, via the two-way
        // response path below, overwrite comments) on boards they cannot access.
        // A board member who is not its admin is published the integration
        // without its URL (a chat webhook URL is itself a credential), so it
        // names the integration by _id.
        const storedIntegration = await ReactiveCache.getIntegration(
          typeof integration._id === 'string'
            ? { _id: integration._id, boardId: integration.boardId }
            : { url: integration.url, boardId: integration.boardId },
        );
        if (!storedIntegration) return;
        const integrationBoard = await ReactiveCache.getBoard(storedIntegration.boardId);
        if (!integrationBoard || !integrationBoard.hasMember(this.userId)) return;

        // HookBleed (2026-10-02): the request was built from the CALLER's
        // integration object (its type decided two-way, its token was sent)
        // and the caller's own description and params - so any member, read-only
        // included, could post arbitrary text to the board's chat webhook as
        // WeKan, or turn a one-way hook two-way. Everything comes from the stored
        // integration now; and from a client, the only legitimate call is the
        // card-opened notification, whose params are rebuilt here from the card.
        if (this.connection) {
          const card = description === 'CardSelected' && typeof params.cardId === 'string'
            ? await ReactiveCache.getCard(params.cardId) : null;
          if (!card || card.boardId !== storedIntegration.boardId) {
            try {
              require('/server/lib/securityLog').record({
                key: 'ssrf.webhook-forge', action: 'blocked', source: 'outgoingWebhooks', userId: this.userId,
                detail: `client tried to send '${String(description).slice(0, 40)}' through webhook ${storedIntegration._id}`,
              });
            } catch (e) { /* logging must never break the guard */ }
            return;
          }
          const caller = await ReactiveCache.getUser(this.userId);
          params = { userId: this.userId, cardId: card._id, boardId: card.boardId, listId: card.listId,
            user: caller && caller.username, url: '' };
        }
        const prepared = await prepareOutgoingWebhook({ integration: storedIntegration, description, params, actorId: this.userId });
        if (!prepared) return;
        const { is2way } = prepared;

        // #3695: a one-way webhook whose delivery settings group or schedule
        // its notifications goes through the durable queue
        // (server/notifications/webhookQueue.js); the built-in settings POST
        // at once, below, exactly as before. Two-way webhooks are always
        // immediate: their reply edits the comment the event was about.
        if (!is2way) {
          const delivery = await webhookDeliveryFor(storedIntegration);
          const queued = webhookQueueTarget(delivery, { boardId: params.boardId, cardId: params.cardId,
            eventId: params.activityId });
          if (queued) {
            await require('/server/notifications/webhookQueue').webhookOutbox.enqueue({
              integrationId: storedIntegration._id, body: JSON.parse(prepared.body), ...queued });
            return;
          }
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

        // fetchSafe resolves DNS once, pins the connection to the resolved IP,
        // and blocks redirects — fully preventing DNS-rebinding SSRF attacks.
        let response;
        try {
          response = await fetchSafe(prepared.url, {
            method: 'POST',
            totalTimeoutMs: 30000,
            headers: prepared.headers,
            body: prepared.body,
          });
        } catch (err) {
          if (/^SSRF_GUARD:/.test(err && err.message)) {
            // IntegrationBleed: a webhook pointed at an internal address.
            try {
              require('/server/lib/securityLog').record({
                key: 'ssrf.webhook', action: 'blocked', source: 'outgoingWebhooks',
                detail: `webhook ${storedIntegration._id}: ${String(err.message).slice(0, 160)}`,
              });
            } catch (e) { /* logging must never break the guard */ }
          }
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
                await responseFunc(data, storedIntegration);
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
