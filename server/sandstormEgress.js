import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { AsyncLocalStorage } from 'node:async_hooks';
import { fetchSafe } from '/server/lib/ssrfGuard';

// The Meteor half of outbound HTTP from a Sandstorm grain through the Powerbox
// (imports/sandstorm/egress.mjs is the protocol half). A user approves an
// external API - Trello - in the Powerbox; the access token Sandstorm hands
// back is kept here, per user and service, and requests made on that user's
// behalf go through the bridge proxy with it.
//
// Off Sandstorm nothing here is used: isSandstormServer() is false and the
// callers keep their ordinary fetch.

const isSandstorm = !!(Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm);

// Server-only and never published: the access token is a capability for the
// grain to reach the service, as the user who granted it.
const SandstormApiGrants = new Mongo.Collection('sandstorm_api_grants');

// Whose grant a request uses. Set where a user starts the work - a method, or
// a background job for the user who created it - so the code that finally
// fetches does not need the user id threaded through every call.
const actingUser = new AsyncLocalStorage();

let egressModule = null;
async function egress() {
  if (!egressModule) egressModule = await import('/imports/sandstorm/egress.mjs');
  return egressModule;
}

export function isSandstormServer() {
  return isSandstorm;
}

export function runAsEgressUser(userId, fn) {
  return actingUser.run(userId || null, fn);
}

const grantId = (userId, service) => `${userId}:${service}`;

function notGranted(label) {
  return new Meteor.Error('sandstorm-api-not-granted',
    `Allow this grain to reach ${label} first, with the Sandstorm Powerbox.`);
}

// fetch() for a URL of a granted service, as the acting user. Throws
// sandstorm-api-not-granted when there is no grant, and
// sandstorm-egress-unreachable for a URL no service covers (a grain has no
// other way out).
export async function sandstormFetch(url, options = {}) {
  const api = await egress();
  const service = api.serviceForUrl(url);
  if (!service) {
    throw new Meteor.Error('sandstorm-egress-unreachable',
      'This address cannot be reached from a Sandstorm grain.');
  }
  const { label } = api.externalApi(service);
  const userId = actingUser.getStore();
  if (!userId) throw notGranted(label);
  const grant = await SandstormApiGrants.findOneAsync(grantId(userId, service));
  if (!grant) throw notGranted(label);
  return api.proxyFetch(url, { ...options, grant });
}

export async function hasSandstormGrant(userId, service) {
  return !!(userId && await SandstormApiGrants.findOneAsync(grantId(userId, service)));
}

// ── Outgoing webhooks through the Powerbox ───────────────────────────────────
// A grain has no network but the bridge proxy, so a webhook leaves only
// through an API a board admin approved in the Powerbox for that webhook's URL.
// Its grant belongs to that DESTINATION (webhook:<granted URL>), not to a
// user: activity on the board sends it, whoever acted, and it is found by the
// URL being sent to, never by a search. Sandstorm lists the connection in the
// grain's settings, where it can be revoked. Off Sandstorm, and for a URL no
// grant covers, this is exactly fetchSafe.
const webhookGrantId = canonicalUrl => `webhook:${canonicalUrl}`;

async function mayManageWebhook(userId, integrationId) {
  const Integrations = require('/models/integrations').default;
  const Boards = require('/models/boards').default;
  const { allowIsBoardAdmin } = require('/server/lib/utils');
  const integration = await Integrations.findOneAsync(integrationId);
  if (!integration) return null;
  const user = await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  const board = await Boards.findOneAsync(integration.boardId);
  return (user && user.isAdmin) || allowIsBoardAdmin(userId, board) ? integration : null;
}

// Same arguments and the same kind of answer as fetchSafe.
export async function webhookFetch(url, options = {}) {
  if (!isSandstorm) return fetchSafe(url, options);
  const api = await egress();
  const target = api.webhookGrantFor(url);
  const grant = target && await SandstormApiGrants.findOneAsync(webhookGrantId(target.canonicalUrl));
  if (!grant || !api.grantCovers(grant, target.url)) return fetchSafe(url, options);
  const res = await api.proxyFetch(target.url, {
    grant,
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body,
    timeoutMs: options.totalTimeoutMs || options.timeoutMs || 30000,
  });
  return readWhole(res, options);
}

// A proxied response, read whole with fetchSafe's size limit, in the shape
// fetchSafe answers with.
async function readWhole(res, options = {}) {
  const limit = Number.isFinite(options.maxResponseBytes) ? options.maxResponseBytes : 10 * 1024 * 1024;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > limit) throw new Error(`outbound response exceeds ${limit} bytes`);
  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    text: async () => bytes.toString('utf8'),
    json: async () => JSON.parse(bytes.toString('utf8')),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

// ── List sync through the Powerbox ──────────────────────────────────────────
// The periodic sync job has no user to act as, so, like a webhook, its grant
// belongs to the destination: the tracker's API root (egress.mjs syncApiRoot),
// approved once by a board member with write access, and found by the URL
// being fetched (grantRootCandidates), never by a search.
const syncGrantId = root => `sync:${root}`;

export async function syncFetch(url, options = {}) {
  const api = await egress();
  for (const root of api.grantRootCandidates(url)) {
    const grant = await SandstormApiGrants.findOneAsync(syncGrantId(root));
    if (grant && api.grantCovers(grant, url)) {
      const res = await api.proxyFetch(url, {
        grant, method: 'GET', headers: options.headers || {}, timeoutMs: options.timeoutMs || 20000,
      });
      return readWhole(res, options);
    }
  }
  throw new Meteor.Error('sandstorm-sync-not-granted',
    'Allow this grain to reach the tracker first: List Sync, then the Sandstorm Powerbox button.');
}

async function syncTarget(userId, listId) {
  const Lists = require('/models/lists').default;
  const Boards = require('/models/boards').default;
  const { allowIsBoardMemberWithWriteAccess } = require('/server/lib/utils');
  const list = await Lists.findOneAsync(listId, { fields: { boardId: 1, syncSource: 1 } });
  const board = list && await Boards.findOneAsync(list.boardId);
  if (!board || !allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('error-notAuthorized');
  const source = list.syncSource || {};
  const api = await egress();
  const { root, reason } = api.syncApiRoot(source.type, source.url);
  if (!root) {
    throw new Meteor.Error('sandstorm-sync-unsupported', reason === 'jira-basic-auth'
      ? 'Jira signs in with an Authorization header, which a Sandstorm grain cannot send.'
      : 'This tracker address cannot be granted.');
  }
  return { api, root };
}

if (isSandstorm) {
  Meteor.methods({
    // The Powerbox query for one webhook: approve exactly its URL's API.
    async sandstormWebhookDescriptor(integrationId) {
      check(integrationId, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const integration = await mayManageWebhook(this.userId, integrationId);
      if (!integration) throw new Meteor.Error('error-notAuthorized');
      const api = await egress();
      const target = api.webhookGrantFor(integration.url);
      if (!target) throw new Meteor.Error('sandstorm-webhook-url', 'This webhook address cannot be granted.');
      const { apiSessionDescriptor } = await import('/imports/sandstorm/bridgeClient.mjs');
      return { descriptor: apiSessionDescriptor(target.canonicalUrl), canonicalUrl: target.canonicalUrl };
    },

    async sandstormClaimWebhookGrant(integrationId, requestToken) {
      check(integrationId, String);
      check(requestToken, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const integration = await mayManageWebhook(this.userId, integrationId);
      if (!integration) throw new Meteor.Error('error-notAuthorized');
      const api = await egress();
      const target = api.webhookGrantFor(integration.url);
      if (!target) throw new Meteor.Error('sandstorm-webhook-url', 'This webhook address cannot be granted.');
      let cap;
      try {
        cap = await api.claimApiGrant(this.connection.sandstormSessionId(), requestToken);
      } catch (e) {
        throw new Meteor.Error('sandstorm-claim-failed', e.message);
      }
      await SandstormApiGrants.upsertAsync(webhookGrantId(target.canonicalUrl), {
        $set: {
          service: 'webhook',
          integrationId,
          boardId: integration.boardId,
          canonicalUrl: target.canonicalUrl,
          cap,
          grantedBy: this.userId,
          grantedAt: new Date(),
        },
      });
      return { granted: true, canonicalUrl: target.canonicalUrl };
    },

    // List sync: the Powerbox query for the list's tracker API.
    async sandstormSyncDescriptor(listId) {
      check(listId, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const { root } = await syncTarget(this.userId, listId);
      const { apiSessionDescriptor } = await import('/imports/sandstorm/bridgeClient.mjs');
      return { descriptor: apiSessionDescriptor(root), canonicalUrl: root };
    },

    async sandstormClaimSyncGrant(listId, requestToken) {
      check(listId, String);
      check(requestToken, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const { api, root } = await syncTarget(this.userId, listId);
      let cap;
      try {
        cap = await api.claimApiGrant(this.connection.sandstormSessionId(), requestToken);
      } catch (e) {
        throw new Meteor.Error('sandstorm-claim-failed', e.message);
      }
      await SandstormApiGrants.upsertAsync(syncGrantId(root), {
        $set: { service: 'sync', listId, canonicalUrl: root, cap, grantedBy: this.userId, grantedAt: new Date() },
      });
      return { granted: true, canonicalUrl: root };
    },

    async sandstormSyncGrantStatus(listId) {
      check(listId, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const { root } = await syncTarget(this.userId, listId);
      const grant = await SandstormApiGrants.findOneAsync(syncGrantId(root), { fields: { canonicalUrl: 1 } });
      return { granted: !!grant, canonicalUrl: root };
    },

    async sandstormWebhookGrantStatus(integrationId) {
      check(integrationId, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const integration = await mayManageWebhook(this.userId, integrationId);
      if (!integration) throw new Meteor.Error('error-notAuthorized');
      const api = await egress();
      const target = api.webhookGrantFor(integration.url);
      const grant = target && await SandstormApiGrants.findOneAsync(webhookGrantId(target.canonicalUrl), { fields: { canonicalUrl: 1 } });
      return { granted: !!grant, canonicalUrl: target ? target.canonicalUrl : null };
    },
  });
}

if (isSandstorm) {
  Meteor.methods({
    // Whether the caller has granted this service, for the import/export UI.
    async sandstormApiGrantStatus(service) {
      check(service, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const api = await egress();
      if (!api.externalApi(service)) throw new Meteor.Error('sandstorm-unknown-api');
      return { granted: await hasSandstormGrant(this.userId, service) };
    },

    // Redeem the Powerbox claim token the client received. It is valid only
    // for this user's current session, so it is exchanged now for the
    // permanent access token, which is tied to the user keeping `participate`.
    async sandstormClaimApiGrant(service, requestToken) {
      check(service, String);
      check(requestToken, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      const api = await egress();
      const definition = api.externalApi(service);
      if (!definition) throw new Meteor.Error('sandstorm-unknown-api');
      const sessionId = this.connection.sandstormSessionId();
      let cap;
      try {
        cap = await api.claimApiGrant(sessionId, requestToken);
      } catch (e) {
        throw new Meteor.Error('sandstorm-claim-failed', e.message);
      }
      await SandstormApiGrants.upsertAsync(grantId(this.userId, service), {
        $set: {
          userId: this.userId,
          service,
          canonicalUrl: definition.canonicalUrl,
          cap,
          grantedAt: new Date(),
        },
      });
      return { granted: true };
    },

    // Forget the access token here. The connection itself is listed, and can
    // be revoked, in the grain's Sandstorm settings.
    async sandstormForgetApiGrant(service) {
      check(service, String);
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');
      await SandstormApiGrants.removeAsync(grantId(this.userId, service));
      return { granted: false };
    },
  });
}
