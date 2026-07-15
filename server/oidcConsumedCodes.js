import { Meteor } from 'meteor/meteor';
import OidcConsumedCodes from '/models/oidcConsumedCodes';
import { ensureIndex } from '/server/lib/mongoStartup';

// Allow/Deny rules
// This collection is server-only and should not be modified by clients.
// Allow server-side operations (when userId is undefined) but deny all client operations.
OidcConsumedCodes.allow({
  insert: (userId) => !userId,
  update: (userId) => !userId,
  remove: (userId) => !userId,
});

// TTL index: entries only need to outlive the longest realistic OIDC
// authorization code lifetime (providers use ~1-10 minutes); 15 minutes
// gives headroom without growing the collection unbounded.
const OIDC_CODE_REPLAY_WINDOW_SECONDS = 15 * 60;

Meteor.startup(async () => {
  await ensureIndex(
    OidcConsumedCodes,
    { createdAt: 1 },
    { expireAfterSeconds: OIDC_CODE_REPLAY_WINDOW_SECONDS },
  );
});
