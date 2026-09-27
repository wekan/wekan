import { Mongo } from 'meteor/mongo';

// A private recovery checkpoint, never a second audit log or a publication.
// _id is the board ID, so separate server processes cannot start two restores.
const ScrumHistoryPending = new Mongo.Collection('scrumHistoryPending');
ScrumHistoryPending.deny({ insert: () => true, update: () => true, remove: () => true });
export default ScrumHistoryPending;
