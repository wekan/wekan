import '../server/recurringCards.js';
import { SyncedCron } from 'meteor/percolate:synced-cron';

Meteor.startup(() => {
  SyncedCron.start();
});
