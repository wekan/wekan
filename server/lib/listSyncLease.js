import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
const { withSyncLease } = require('/server/lib/syncLease');

// Private coordination records contain no provider URLs or credentials.
const leases = new Mongo.Collection('listSyncLeases');
leases.deny({ insert: () => true, update: () => true, remove: () => true });

export async function withListSyncLease(listId, work) {
  try {
    return await withSyncLease(leases.rawCollection(), listId, work);
  } catch (error) {
    if (error.code === 'sync-busy' || error.code === 'sync-lease-lost') {
      throw new Meteor.Error(error.code, error.message);
    }
    throw error;
  }
}
