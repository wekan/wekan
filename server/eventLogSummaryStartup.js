import { Meteor } from 'meteor/meteor';
import { foldLegacyEventLogRows } from '/server/lib/eventLogSummaryMigration';

// Once, in the background, after the database is up. Never blocks startup and
// never throws into it: Admin Panel -> Problems showing the old per-event rows
// for a little longer is a far smaller problem than a server that will not come
// up because of a housekeeping pass.
Meteor.startup(() => {
  Meteor.setTimeout(() => {
    foldLegacyEventLogRows().catch(e => {
      if (process.env.DEBUG === 'true') {
        console.warn('eventlog summary migration failed:', e && e.message);
      }
    });
  }, 5000);
});
