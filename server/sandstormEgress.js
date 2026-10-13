import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { AsyncLocalStorage } from 'node:async_hooks';

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
