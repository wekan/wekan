import { Mongo } from 'meteor/mongo';

// Private, durable replacement decisions. No tokens, publications or DDP writes.
// One row per list/source/item keeps retries and other workers on the same ID.
const ListSyncTargets = new Mongo.Collection('listSyncTargets');
ListSyncTargets.deny({ insert: () => true, update: () => true, remove: () => true });
export default ListSyncTargets;
