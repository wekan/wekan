const fs = require('fs');
const os = require('os');

// Configure SyncedCron to suppress console logging
// This must be done before any SyncedCron operations
if (Meteor.isServer) {
  const { SyncedCron } = require('meteor/quave:synced-cron');
  SyncedCron.config({
    log: false, // Disable console logging
    collectionName: 'cronJobs', // Use custom collection name
    utc: false, // Use local time
    collectionTTL: 172800 // 2 days TTL
  });
}

let errors = [];
if (!process.env.WRITABLE_PATH) {
  errors.push("WRITABLE_PATH environment variable missing and/or unset, please configure !");
} else {
  try {
    fs.accessSync(process.env.WRITABLE_PATH, fs.constants.W_OK);
  } catch (err) {
    const userInfo = os.userInfo();
    errors.push("can't write to " + process.env.WRITABLE_PATH, err);
    errors.push("the path of WRITABLE_PATH (" + process.env.WRITABLE_PATH + ") must be writable !!!");
    errors.push("username: " + userInfo["username"] + " - uid: " + userInfo["uid"] + " - gid: " + userInfo["gid"]);
  }
}

if (errors.length > 0) {
  console.error("\n\n");
  console.error(errors.join("\n"));
  console.error("\n");
  console.error("Stopping Wekan");
  console.error("Wekan isn't runnable. Please resolve the error's above and restart Wekan !");
  console.error("\n\n");
  process.exit(1);
}

// Import cron job storage for persistent job tracking
import './cronJobStorage';

// Import migrations
import './migrations/fixMissingListsMigration';
import './migrations/fixAvatarUrls';
import './migrations/fixAllFileUrls';
import './migrations/comprehensiveBoardMigration';

// Import file serving routes
import './routes/universalFileServer';
import './routes/customHeadAssets';

// Import server-side custom head rendering
import './lib/customHeadRender';

// Note: Automatic migrations are disabled - migrations only run when opening boards
// import './boardMigrationDetector';
// import './cronMigrationManager';
