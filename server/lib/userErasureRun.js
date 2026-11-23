// Runs the erasure rules of models/lib/userErasure.js against the database:
// on account deletion (models/users.js, Users.after.remove) and on
// anonymisation (server/models/users.js, anonymizeUser). The rules name
// collections, some of them server-only modules, so they are reached through
// the driver by name rather than by importing every model here.
import { MongoInternals } from 'meteor/mongo';

const { buildUserErasure, applyUserErasure } = require('/models/lib/userErasure');

export async function runUserErasure(user, mode) {
  const rules = buildUserErasure(user, mode);
  if (!rules) return {};
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  return applyUserErasure(rules, name => db.collection(name), (collection, error) =>
    console.error(`[userErasure] ${mode} of ${user._id}: ${collection} not erased:`, error));
}
